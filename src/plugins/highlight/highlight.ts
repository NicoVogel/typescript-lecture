import {HighlightSection} from './serialize';

/**
 * Visually emphasize specific lines within a code block.
 * This only works on blocks with line numbering turned on.
 *
 * @param {HTMLElement} block a <code> block
 * @param {String} [highlightSection] The lines that should be
 * highlighted in this format:
 * "1" 		= highlights line 1
 * "2,5"	= highlights lines 2 & 5
 * "2,5-7"	= highlights lines 2, 5, 6 & 7
 */
export function highlightLines(
  block: HTMLElement,
  highlightSteps: HighlightSection[]
) {
  const elementsToHighlight = highlightSteps
    .map(highlight => {
      if ('end' in highlight) {
        return {
          type: 'range',
          config: highlight,
          elements: Array.from(
            block.querySelectorAll(
              `table tr:nth-child(n+${highlight.start}):nth-child(-n+${highlight.end})`
            )
          ).filter(Boolean),
        } as const;
      }

      const tr = block.querySelector(`table tr:nth-child(${highlight.start})`);
      if ('column' in highlight) {
        const td = tr?.querySelector<HTMLElement>(`td:nth-child(2)`);
        return {
          type: 'column',
          config: highlight,
          elements: td ? [tr!, td] : [],
        } as const;
      }

      return {
        type: 'line',
        config: highlight,
        elements: [tr].filter(Boolean),
      } as const;
    })
    .filter(x => x.elements.length > 0);

  elementsToHighlight.forEach(x => {
    if (x.type !== 'column') {
      x.elements.forEach(y => y.classList.add('highlight-line'));
      return;
    }
    const [tr, td] = x.elements;
    tr.classList.add('highlight-line');
    const codeSegments = findAllElements(td);
    const newTd = highlightOnlyRange(td, codeSegments, [x.config.column]);
    console.log(newTd);
    td.replaceWith(newTd);
    // const outsideRange = findElementsOutsideRanges(element, [x.config.column]);
    // transformCode(td, [x.config.column]);

    // console.log(findElementsOutsideRanges(tr, [x.config.column]));
  });

  if (elementsToHighlight.length > 0) {
    block.classList.add('has-highlights');
  }
}
type Range = {from: number; to: number};
type CodeSegment = {start: number; end: number; element: Element | Text};

function findAllElements(tdElement: Element): CodeSegment[] {
  let currentIndex = 0;
  const results: CodeSegment[] = [];

  tdElement.childNodes.forEach(node => {
    const nodeLength = node.textContent!.length;
    const result: CodeSegment = {
      start: currentIndex,
      end: currentIndex + nodeLength,
      element:
        node.nodeType === Node.TEXT_NODE ? (node as Text) : (node as Element),
    };

    results.push(result);
    currentIndex += nodeLength;
  });

  return results;
}

function highlightOnlyRange(
  td: Element,
  segments: CodeSegment[],
  ranges: Range[]
): HTMLTableCellElement {
  const newTd = td.cloneNode(false) as HTMLTableCellElement;

  // Helper function to check if a segment is within any of the ranges
  const isInAnyRange = (segment: CodeSegment) => {
    return ranges.some(
      range => segment.start < range.to && segment.end > range.from
    );
  };

  segments.forEach(segment => {
    if (isInAnyRange(segment)) {
      // If the segment is within any range, append it as is
      newTd.appendChild(segment.element.cloneNode(true));
    } else {
      // If the segment is outside the ranges, wrap it in a no-highlight span
      const span = document.createElement('span');
      span.className = 'no-highlight';
      span.appendChild(segment.element.cloneNode(true));
      newTd.appendChild(span);
    }
  });

  return newTd;
}
