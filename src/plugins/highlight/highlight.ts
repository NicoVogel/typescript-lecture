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
          elements: Array.from(
            block.querySelectorAll(
              `table tr:nth-child(n+${highlight.start}):nth-child(-n+${highlight.end})`
            )
          ).filter(Boolean),
        } as const;
      }

      const tr = block.querySelector(`table tr:nth-child(${highlight.start})`);
      if ('columns' in highlight) {
        const td = tr?.querySelector<HTMLElement>(`td:nth-child(2)`);
        return {
          type: 'column',
          ranges: highlight.columns,
          elements: td ? [tr!, td] : [],
        } as const;
      }

      return {
        type: 'line',
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
    const info = getColumnCharInfo(td, x.ranges);
    const grouped = groupColumnCharInfo(info);
    const newTd = createTdFromGroupedCharInfo(td, grouped);
    td.replaceWith(newTd);
  });

  if (elementsToHighlight.length > 0) {
    block.classList.add('has-highlights');
  }
}
type Range = {from: number; to: number};

type ColumnCharInfo = {
  char: string;
  isHighlighted: boolean;
  originalClasses: string[];
};

type GroupedCharInfo = {
  isHighlighted: boolean;
  text: string;
  originalClasses?: string[];
};

function getColumnCharInfo(
  td: Element,
  highlightRanges: Range[]
): ColumnCharInfo[] {
  const charInfo: ColumnCharInfo[] = [];
  let currentColumnIndex = 0;

  const isHighlighted = (index: number): boolean =>
    highlightRanges.some(range => index >= range.from && index < range.to);

  const processNode = (node: Node, classes: string[]) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      for (const char of text) {
        charInfo.push({
          char: char,
          isHighlighted: isHighlighted(currentColumnIndex),
          originalClasses: classes,
        });
        currentColumnIndex++;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const childClasses = [...element.classList];
      node.childNodes.forEach(childNode =>
        processNode(childNode, childClasses)
      );
    }
  };

  td.childNodes.forEach(node => processNode(node, []));

  return charInfo;
}

function groupColumnCharInfo(charInfo: ColumnCharInfo[]): GroupedCharInfo[] {
  const grouped: GroupedCharInfo[] = [];
  let currentGroup: GroupedCharInfo | null = null;

  for (const info of charInfo) {
    if (currentGroup && currentGroup.isHighlighted === info.isHighlighted) {
      if (info.isHighlighted) {
        // Further group by originalClasses for highlighted chars
        if (arraysEqual(currentGroup.originalClasses, info.originalClasses)) {
          currentGroup.text += info.char;
        } else {
          grouped.push(currentGroup);
          currentGroup = {...info, text: info.char};
        }
      } else {
        // Continue grouping non-highlighted chars
        currentGroup.text += info.char;
      }
    } else {
      // Start a new group
      if (currentGroup) {
        grouped.push(currentGroup);
      }
      currentGroup = {
        isHighlighted: info.isHighlighted,
        text: info.char,
        originalClasses: info.isHighlighted ? info.originalClasses : undefined,
      };
    }
  }

  // Push the last group
  if (currentGroup) {
    grouped.push(currentGroup);
  }

  return grouped;
}

// Helper function to compare two arrays
function arraysEqual(
  a: string[] | undefined,
  b: string[] | undefined
): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function createTdFromGroupedCharInfo(
  originalTd: Element,
  groupedCharInfo: GroupedCharInfo[]
): HTMLTableCellElement {
  const newTd = originalTd.cloneNode(false) as HTMLTableCellElement;

  groupedCharInfo.forEach(group => {
    if (group.isHighlighted) {
      if (group.originalClasses && group.originalClasses.length > 0) {
        // Create a span with the original classes
        const span = document.createElement('span');
        span.className = group.originalClasses.join(' ');
        span.textContent = group.text;
        newTd.appendChild(span);
      } else {
        // Append the text directly if no original classes are present
        newTd.appendChild(document.createTextNode(group.text));
      }
    } else {
      // Create a span with the 'no-highlight' class for non-highlighted text
      const span = document.createElement('span');
      span.className = 'no-highlight';
      span.textContent = group.text;
      newTd.appendChild(span);
    }
  });

  return newTd;
}
