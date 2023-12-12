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
  | {start: number; columns: {from: number; to: number}[]};

/**
 * Deserializes a highlight definition string into an object structure.
 * This function parses a given highlight definition string and converts it
 * into an object that represents the various highlighting sections.
 *
 * The function supports different formats:
 * - Single line highlighting (e.g., "6")
 * - Range line highlighting (e.g., "6-8")
 * - Column highlighting within a line (e.g., "6(7-15)")
 * - Multiple column highlights within the same line (e.g., "6(7-15,23-28)")
 * - Single character column highlighting (e.g., "6(7)")
 *
 * @example
 * // Single line highlighting
 * deserializeHighlightDefinitions("6");
 * // Output: { showLineNumber: false, highlightSections: [[{ start: 6 }]] }
 *
 * @example
 * // Range line highlighting
 * deserializeHighlightDefinitions("6-8");
 * // Output: { showLineNumber: false, highlightSections: [[{ start: 6, end: 8 }]] }
 *
 * @example
 * // Column highlighting within a line
 * deserializeHighlightDefinitions("6(7-15)");
 * // Output: { showLineNumber: false, highlightSections: [[{ start: 6, column: [{ from: 7, to: 15 }] }]] }
 *
 * @example
 * // Multiple column highlights within the same line
 * deserializeHighlightDefinitions("6(7-15,23-28)");
 * // Output: { showLineNumber: false, highlightSections: [[{ start: 6, column: [{ from: 7, to: 15 }, { from: 23, to: 28 }] }]] }
 *
 * @example
 * // Single character column highlighting
 * deserializeHighlightDefinitions("6(7)");
 * // Output: { showLineNumber: false, highlightSections: [[{ start: 6, column: [{ from: 7, to: 8 }] }]] }
 */
export function deserializeHighlightDefinitions(
  highlightDefinition: string | null
): HighlightDefinition | string {
  if (highlightDefinition === null || highlightDefinition === '') {
    return {showLineNumber: false, highlightSections: []};
  }

  const parsed = parseHighlightDefinition(highlightDefinition);
  if (typeof parsed === 'string') {
    return parsed;
  }
  const {highlight, ...lineNumberConfig} = parsed;

  const highlightSections = highlight.split('|').map(frame => {
    const sections: (HighlightSection | null)[] = [];
    let buffer = '';
    let inParentheses = false;

    for (const char of frame) {
      if (char === '(') inParentheses = true;
      if (char === ')') inParentheses = false;

      if (char === ',' && !inParentheses) {
        if (buffer) sections.push(parseSection(buffer));
        buffer = '';
      } else {
        buffer += char;
      }
    }

    if (buffer) sections.push(parseSection(buffer));
    return sections.filter(Boolean);
  });

  return {
    ...lineNumberConfig,
    highlightSections,
  };
}

function parseSection(sectionStr: string): HighlightSection | null {
  const match = sectionStr.match(
    /^(\d+)(?:-(\d+))?(?:\(([\d,-]+)\))?$/ // Regex to parse each section
  );
  if (!match) return null;

  const start = parseInt(match[1]);
  const end = match[2] ? parseInt(match[2]) : undefined;
  const columnPart = match[3];

  if (isNaN(start)) return null;

  if (columnPart) {
    const columns = columnPart.split(',').map(col => {
      const [fromStr, toStr] = col.split('-');
      const from = parseInt(fromStr);
      const to = toStr ? parseInt(toStr) : from + 1;
      return {from, to};
    });
    return {start, columns};
  } else if (end !== undefined) {
    return {start, end};
  } else {
    return {start};
  }
}

export function serializeHighlightSection(
  highlightSection: HighlightSection[]
): string {
  return highlightSection
    .map(section => {
      if ('columns' in section) {
        const columnPart = section.columns
          .map(col =>
            col.from === col.to ? `${col.from}` : `${col.from}-${col.to}`
          )
          .join(',');
        return `${section.start}(${columnPart})`;
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
