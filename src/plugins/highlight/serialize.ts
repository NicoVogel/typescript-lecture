export type HighlightDefinition = {
  highlightSections: HighlightSection[][];
} & (
  | {
      showLineNumber: false;
    }
  | {
      offset: number;
      showLineNumber: true;
    }
);

export type HighlightSection =
  | {start: number}
  | {start: number; end: number}
  | {start: number; column: {from: number; to: number}};

/**
 * Parses and formats a user-defined string of line
 * numbers to highlight.
 *
 * @example
 * deserializeHighlightSteps( '1,2|3,5-10|6(1)|6(5-10)' )
 * // {
 * // showLineNumbers: true,
 * // highlightSection:[
 * //   [ { start: 1 }, { start: 2 } ],
 * //   [ { start: 3 }, { start: 5, end: 10 } ],
 * //   [ { start: 6, column: {from: 1, to: 1} } ],
 * //   [ { start: 6, column: {from: 5, to: 10} } ],
 * // ]}
 * @example
 * deserializeHighlightSteps( 'X1,2|3,5-10|6(1)|6(5-10)' )
 * // {
 * // showLineNumbers: false,
 * // highlightSection:[
 * //   [ { start: 1 }, { start: 2 } ],
 * //   [ { start: 3 }, { start: 5, end: 10 } ],
 * //   [ { start: 6, column: {from: 1, to: 1} } ],
 * //   [ { start: 6, column: {from: 5, to: 10} } ],
 * // ]}
 * @example
 * deserializeHighlightSteps( '' )
 * // {
 * // showLineNumbers: false,
 * // highlightSection:[
 * // ]}
 * @example
 * deserializeHighlightSteps( '25:' )
 * // {
 * // showLineNumbers: true,
 * // offset: 25
 * // highlightSection:[
 * // ]}
 */
export function deserializeHighlightDefinitions(
  highlightDefinition: string | null
): HighlightDefinition | string {
  if (highlightDefinition === null) {
    return {showLineNumber: false, highlightSections: []};
  }
  if (highlightDefinition === '') {
    return {showLineNumber: false, highlightSections: []};
  }

  const parsed = parseHighlightDefinition(highlightDefinition);
  if (typeof parsed === 'string') {
    return parsed;
  }
  const {highlight, ...lineNumberConfig} = parsed;

  const highlightSections = highlight.split('|').map(frame => {
    return frame
      .split(',')
      .map<HighlightSection | null>(section => {
        const match = section.match(
          /^(\d+)(?:-(\d+))?(?:\((\d+)(?:-(\d+))?\))?$/
        );
        if (!match) return null;

        const start = parseInt(match[1]);
        const end = match[2] ? parseInt(match[2]) : undefined;
        const colFrom = match[3] ? parseInt(match[3]) : undefined;
        const colTo = match[4] ? parseInt(match[4]) : colFrom;

        if (isNaN(start)) return null;
        if (colFrom !== undefined && colTo !== undefined) {
          return {start, column: {from: colFrom, to: colTo}};
        } else if (end !== undefined) {
          return {start, end};
        } else {
          return {start};
        }
      })
      .filter(Boolean);
  });
  return {
    ...lineNumberConfig,
    highlightSections,
  };
}
export function serializeHighlightSection(
  highlightSection: HighlightSection[]
): string {
  return highlightSection
    .map(section => {
      if ('column' in section) {
        const columnPart =
          section.column.from === section.column.to
            ? `(${section.column.from})`
            : `(${section.column.from}-${section.column.to})`;
        return `${section.start}${columnPart}`;
      }

      if ('end' in section) {
        return `${section.start}-${section.end}`;
      }

      return `${section.start}`;
    })
    .join(',');
}

function parseHighlightDefinition(input: string):
  | {
      showLineNumber: false;
      highlight: string;
    }
  | {
      offset: number;
      showLineNumber: true;
      highlight: string;
    }
  | string {
  const parts = input.split(':');
  if (parts.length > 2) {
    return 'Invalid format if more than one colon';
  }

  if (parts.length === 1) {
    return {
      highlight: parts[0],
      showLineNumber: false,
    };
  }

  const [lineNumberConfig, highlight] = parts;

  const isNotNumber = (x: string | number) => isNaN(Number(x));

  if (isNotNumber(lineNumberConfig)) {
    if (lineNumberConfig === 'N') {
      return {
        highlight,
        offset: 0,
        showLineNumber: true,
      };
    }
    return {
      highlight,
      showLineNumber: false,
    };
  }
  const offset = Number(lineNumberConfig);
  if (offset < 0) {
    return 'Invalid offset value, it can not be lower than 0';
  }
  return {
    highlight,
    offset,
    showLineNumber: true,
  };
}
