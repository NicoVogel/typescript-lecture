import {
  LitElement,
  html,
  css,
  TemplateResult,
  CSSResultGroup,
  nothing,
} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import type {SelectionDetail} from './code-editor-wrapper';

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

@customElement('code-selection-manager')
export class CodeSelectionManager extends LitElement {
  @state() private selections: ListEntry[] = [];
  @state() private latestSelection?: ListEntry;

  static get styles(): CSSResultGroup {
    return css``;
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.body.addEventListener('code-selection', x =>
      this.handleCodeSelection(x)
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.body.removeEventListener('code-selection', x =>
      this.handleCodeSelection(x)
    );
  }

  handleCodeSelection(event: CustomEvent<SelectionDetail>): void {
    this.latestSelection = parseSelection(event.detail);
  }

  render(): TemplateResult {
    return html`
      ${this.renderHeader()}
      <ul>
        ${this.selections.map((selection, index) =>
          this.renderListElement(selection, index)
        )}
      </ul>
    `;
  }

  private renderHeader() {
    return html` <div>
      <div>
        ${getCombinedSelectionText(this.selections)}
        <button @click="${this.copyToClipboard}">Copy to Clipboard</button>
      </div>
      <div>
        <span>
          ${this.latestSelection
            ? convertListEntryToHighlightSelectionText(this.latestSelection)
            : 'Nothing selected yet'}
        </span>
        ${this.latestSelection
          ? html`<button @click="${this.addSelectionToList}">
              Add to List
            </button>`
          : ''}
      </div>
      <button @click="${this.addSeparatorToList}">Add Separator</button>
    </div>`;
  }

  private renderListElement(selection: ListEntry, index: number) {
    const text =
      selection.type === 'separator'
        ? 'Separator'
        : convertListEntryToHighlightSelectionText(selection);
    return html`<div>
      ${selection.type === 'columns'
        ? html` <input
            type="checkbox"
            .checked=${selection.fullLine}
            @change=${() => this.toggleFullLine(index)}
          />`
        : nothing}
      ${text}
      <button @click="${() => this.deleteSelection(index)}">Delete</button>
      <button @click="${() => this.moveSelection(index, 'up')}">Move Up</button>
      <button @click="${() => this.moveSelection(index, 'down')}">
        Move Down
      </button>
    </div>`;
  }

  private addSelectionToList(): void {
    if (!this.latestSelection) return;
    this.selections = [...this.selections, this.latestSelection];
    this.latestSelection = undefined;
  }

  private addSeparatorToList(): void {
    this.selections = [...this.selections, {type: 'separator'}];
  }

  private deleteSelection(index: number): void {
    this.selections = [
      ...this.selections.slice(0, index),
      ...this.selections.slice(index + 1),
    ];
  }

  private moveSelection(index: number, direction: 'up' | 'down'): void {
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
  }

  private toggleFullLine(index: number): void {
    const selection = this.selections[index];
    if (selection && 'columns' in selection) {
      selection.fullLine = !selection.fullLine;
      this.requestUpdate();
    }
  }

  copyToClipboard(): void {
    const textToCopy = getCombinedSelectionText(this.selections);
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        console.log('Text copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  }
}

function parseSelection(selection: SelectionDetail): ListEntry {
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

function convertListEntryToHighlightSelectionText(
  selection: ListEntry
): string {
  switch (selection.type) {
    case 'range':
      return `${selection.start}-${selection.end}`;
    case 'columns':
      if (selection.fullLine) {
        return `${selection.start}`;
      }
      return `${selection.start}(${selection.columns
        .map(column => `${column.from}-${column.to}`)
        .join(',')})`;
    case 'single':
      return `${selection.start}`;
    case 'separator':
      return '';
    default:
      return '';
  }
}

function getCombinedSelectionText(selections: ListEntry[]): string {
  const groupedSelections = groupSelections(selections);
  return groupedSelections
    .map(group => {
      const mergedGroup = mergeGroup(group);
      return mergedGroup
        .map(convertListEntryToHighlightSelectionText)
        .join(',');
    })
    .join('|');
}

function groupSelections(selections: ListEntry[]): EntryGroup[][] {
  const groups: EntryGroup[][] = [];
  let currentGroup: EntryGroup[] = [];

  selections.forEach(selection => {
    if (selection.type === 'separator') {
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

function mergeGroup(group: EntryGroup[]): EntryGroup[] {
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
      return column;
    }
  );

  return [...ranges, ...rangeInColumn].sort((a, b) => a.start - b.start);
}

function decomposeGroup(group: ListEntry[]) {
  const selectedLines = new Set<number>();
  const selectedColumns = new Map<number, Set<number>>();

  const addRange = (from: number, to: number, range: Set<number>) => {
    for (let i = from; i <= to; i++) {
      range.add(i);
    }
  };

  group.forEach(selection => {
    switch (selection.type) {
      case 'range':
        addRange(selection.start, selection.end, selectedLines);
        break;
      case 'columns':
        if (selection.fullLine) {
          selectedLines.add(selection.start);
          break;
        }
        const columns =
          selectedColumns.get(selection.start) ?? new Set<number>();
        selection.columns.forEach(column => {
          // column selections are 1-based, but we need 0-based for the range
          addRange(column.from, column.to - 1, columns);
        });
        selectedColumns.set(selection.start, columns);
        break;
      case 'single':
        selectedLines.add(selection.start);
        break;
      case 'separator':
        break;
    }
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
    group: EntryGroup[]
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
    group.push(newEntry);
  };
  const mergedGroup: EntryGroup[] = [];
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
