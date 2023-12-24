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
    return css`
      pre {
        margin: 0;
      }

      :host {
        color: var(--r-theme-dark-shades);
        background-color: var(--r-theme-dark-accent);
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }

      button {
        background-color: var(--r-theme-main-brand-color);
        color: var(--r-theme-light-shades);
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      button:hover {
        background-color: var(--r-theme-dark-accent);
      }

      ul {
        list-style-type: none;
        padding: 0;
      }

      .entry {
        display: flex;
        align-items: center;
      }

      .list-item {
        background-color: var(--r-theme-light-shades);
        color: var(--r-theme-dark-shades);
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
        padding-left: 1rem;
        height: 2.5rem;
        border-radius: 0.5rem;
      }

      .item-text {
        flex-grow: 1;
      }

      .move-container {
        background-color: var(--r-theme-main-brand-color);
        display: flex;
        flex-direction: column;
        height: 100%;
        justify-content: space-evenly;
      }
      .move-button {
        display: flex;
        padding: 0 0.25rem;
        border: none;
        font-size: 1rem;
        flex-grow: 1;
        flex-direction: column;
        justify-content: center;
      }

      .delete-button {
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        background-color: var(--r-theme-danger);
        border: none;
        height: 100%;
        font-size: 1rem;
        padding: 0 1rem;
        border-radius: 0 0.5rem 0.5rem 0;
      }

      .slider {
        padding: 0 1rem;
      }
    `;
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
        <pre>${getCombinedSelectionText(this.selections)}</pre>
        <button @click="${this.copyToClipboard}">
          <reveal-icon icon="clipboard"></reveal-icon>
        </button>
      </div>
      <div>
        <pre>
          ${this.latestSelection
            ? convertListEntryToHighlightSelectionText(this.latestSelection)
            : 'Nothing selected yet'}
        </pre
        >
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
    return html`<li class="list-item">
      <pre class="item-text">${text}</pre>
      ${selection.type === 'columns'
        ? html` <comp-slider
            class="slider"
            ?isActive=${selection.fullLine}
            @slider-change=${() => this.toggleFullLine(index)}
          ></comp-slider>`
        : nothing}
      <div class="move-container">
        <button
          class="move-button"
          @click="${() => this.moveSelection(index, 'up')}"
        >
          <reveal-icon icon="arrow-up" size="small"></reveal-icon>
        </button>
        <button
          class="move-button"
          @click="${() => this.moveSelection(index, 'down')}"
        >
          <reveal-icon icon="arrow-down" size="small"></reveal-icon>
        </button>
      </div>
      <button
        class="delete-button"
        @click="${() => this.deleteSelection(index)}"
      >
        <reveal-icon icon="delete" size="small"></reveal-icon>
      </button>
    </li>`;
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

  private copyToClipboard(): void {
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
