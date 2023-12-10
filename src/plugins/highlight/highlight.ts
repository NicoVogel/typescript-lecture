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
    .flatMap(highlight => {
      if ('end' in highlight) {
        // Collect a range of lines
        return Array.from(
          block.querySelectorAll(
            `table tr:nth-child(n+${highlight.start}):nth-child(-n+${highlight.end})`
          )
        );
      }
      return block.querySelector(`table tr:nth-child(${highlight.start})`);
    })
    .filter(Boolean);

  elementsToHighlight.forEach(lineElement => {
    lineElement.classList.add('highlight-line');
  });

  if (elementsToHighlight.length > 0) {
    block.classList.add('has-highlights');
  }
}
