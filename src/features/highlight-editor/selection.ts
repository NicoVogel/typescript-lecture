import {SelectionDetail} from './code-editor-wrapper';

export type ListEntry = EntryGroup | {type: 'separator'};

type EntryGroup =
  | ColumnEntry
  | {type: 'range'; start: number; end: number}
  | {type: 'single'; start: number};

type ColumnEntry = {
  type: 'columns';
  start: number;
  columns: {from: number; to: number}[];
  fullLine: boolean;
};

export class Selection {
  private entry: ListEntry;

  get isSeparator() {
    return this.entry.type === 'separator';
  }

  get isColumn() {
    return this.entry.type === 'columns';
  }

  get fullLine() {
    if (this.entry.type !== 'columns') {
      return false;
    }
    return this.entry.fullLine;
  }

  public constructor(details?: SelectionDetail | EntryGroup) {
    if (!details) {
      this.entry = {type: 'separator'};
      return;
    }
    if ('startPosition' in details) {
      this.entry = this.parseSelection(details);
      return;
    }
    this.entry = details;
  }

  changeFullLine(state: boolean): void {
    if (this.entry && 'columns' in this.entry) {
      this.entry.fullLine = state;
    }
  }

  toString() {
    switch (this.entry.type) {
      case 'range':
        return `${this.entry.start}-${this.entry.end}`;
      case 'columns':
        if (this.entry.fullLine) {
          return `${this.entry.start}`;
        }
        return `${this.entry.start}(${this.entry.columns
          .map(column => `${column.from}-${column.to}`)
          .join(',')})`;
      case 'single':
        return `${this.entry.start}`;
      case 'separator':
        return '';
      default:
        return '';
    }
  }

  decompose(
    selectedLines: Set<number>,
    selectedColumns: Map<number, Set<number>>
  ) {
    switch (this.entry.type) {
      case 'range':
        this.addRange(this.entry.start, this.entry.end, selectedLines);
        break;
      case 'columns':
        if (this.entry.fullLine) {
          selectedLines.add(this.entry.start);
          break;
        }
        const columns =
          selectedColumns.get(this.entry.start) ?? new Set<number>();
        this.entry.columns.forEach(column => {
          // column selections are 1-based, but we need 0-based for the range
          this.addRange(column.from, column.to - 1, columns);
        });
        selectedColumns.set(this.entry.start, columns);
        break;
      case 'single':
        selectedLines.add(this.entry.start);
        break;
      case 'separator':
        break;
    }
  }

  compare(other: Selection): number {
    if (this.entry.type === 'separator' || other.entry.type === 'separator') {
      return 0;
    }
    return this.entry.start - other.entry.start;
  }

  private addRange(from: number, to: number, range: Set<number>) {
    for (let i = from; i <= to; i++) {
      range.add(i);
    }
  }

  private parseSelection(selection: SelectionDetail): ListEntry {
    const {startPosition, endPosition} = selection;
    if (startPosition.row === endPosition.row) {
      return {
        type: 'columns',
        start: startPosition.row,
        columns: [{from: startPosition.position, to: endPosition.position}],
        fullLine: false,
      };
    } else {
      return {
        type: 'range',
        start: startPosition.row,
        end: endPosition.row,
      };
    }
  }
}

export class Selections {
  private selections: Selection[] = [];

  constructor(private onChange: () => void) {}

  addSelection(selection: Selection): void {
    this.selections = [...this.selections, selection];
    this.onChange();
  }

  addSeparator(): void {
    this.selections = [...this.selections, new Selection()];
    this.onChange();
  }

  deleteSelection(index: number): void {
    this.selections = [
      ...this.selections.slice(0, index),
      ...this.selections.slice(index + 1),
    ];
    this.onChange();
  }

  moveSelection(index: number, direction: 'up' | 'down'): void {
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < this.selections.length - 1)
    ) {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const newSelections = [...this.selections];
      [newSelections[index], newSelections[newIndex]] = [
        newSelections[newIndex],
        newSelections[index],
      ];
      this.selections = newSelections;
    }
    this.onChange();
  }

  changeFullLine(index: number, state: boolean): void {
    this.selections[index].changeFullLine(state);
    this.onChange();
  }

  [Symbol.iterator](): Iterator<Selection> {
    return this.selections[Symbol.iterator]();
  }

  toString(): string {
    const groupedSelections = groupSelections(this.selections);
    return groupedSelections
      .map(group => {
        const mergedGroup = mergeGroup(group);
        return mergedGroup.map(selection => selection.toString()).join(',');
      })
      .join('|');
  }
}

function groupSelections(selections: Selection[]): Selection[][] {
  const groups: Selection[][] = [];
  let currentGroup: Selection[] = [];

  selections.forEach(selection => {
    if (selection.isSeparator) {
      groups.push(currentGroup);
      currentGroup = [];
    } else {
      currentGroup.push(selection);
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

function mergeGroup(group: Selection[]): Selection[] {
  const {selectedColumns, selectedLines} = decomposeGroup(group);
  const ranges = reconstructRanges(selectedLines);

  const rangeInColumn = [...selectedColumns.entries()].map(
    ([line, columns]) => {
      const column: ColumnEntry = {
        type: 'columns',
        start: line,
        columns: reconstructColumns(columns),
        fullLine: false,
      };
      return new Selection(column);
    }
  );

  return [...ranges, ...rangeInColumn].sort((a, b) => a.compare(b));
}

function decomposeGroup(group: Selection[]) {
  const selectedLines = new Set<number>();
  const selectedColumns = new Map<number, Set<number>>();

  group.forEach(selection => {
    selection.decompose(selectedLines, selectedColumns);
  });

  // if the full line is already selected, remove the column selection
  selectedLines.forEach(line => {
    selectedColumns.delete(line);
  });

  return {selectedLines, selectedColumns};
}

function reconstructRanges(selectedLines: Set<number>) {
  const addEntry = (
    range: {start: number; end: number},
    group: Selection[]
  ) => {
    const newEntry =
      range.start === range.end
        ? ({
            type: 'single',
            start: range.start,
          } as const)
        : ({
            type: 'range',
            start: range.start,
            end: range.end,
          } as const);
    group.push(new Selection(newEntry));
  };
  const mergedGroup: Selection[] = [];
  let currentRange: {start: number; end: number} | undefined;

  [...selectedLines]
    .sort((a, b) => a - b)
    .forEach(line => {
      if (currentRange && line === currentRange.end + 1) {
        currentRange.end = line;
      } else {
        if (currentRange) {
          addEntry(currentRange, mergedGroup);
        }
        currentRange = {start: line, end: line};
      }
    });
  if (currentRange) {
    addEntry(currentRange, mergedGroup);
  }
  return mergedGroup;
}

function reconstructColumns(
  selectedLines: Set<number>
): ColumnEntry['columns'] {
  const mergedGroup: ReturnType<typeof reconstructColumns> = [];
  let currentRange: {from: number; to: number} | undefined;

  [...selectedLines]
    .sort((a, b) => a - b)
    .forEach(line => {
      if (currentRange && line === currentRange.to + 1) {
        currentRange.to = line;
      } else {
        if (currentRange) {
          mergedGroup.push(currentRange);
        }
        currentRange = {from: line, to: line};
      }
    });
  if (currentRange) {
    mergedGroup.push(currentRange);
  }
  return mergedGroup.map(column => {
    // revert the base conversion from decomposeGroup
    column.to++;
    return column;
  });
}
