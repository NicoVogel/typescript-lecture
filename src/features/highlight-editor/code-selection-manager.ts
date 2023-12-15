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

export type ListEntry =
  | {start: number}
  | {start: number; end: number}
  | {start: number; columns: {from: number; to: number}[]; fullLine: boolean};

@customElement('code-selection-manager')
export class CodeSelectionManager extends LitElement {
  @state() private selections: ListEntry[] = [];
  @state() private latestSelection?: ListEntry;

  static get styles(): CSSResultGroup {
    return css`
      /* Add your styles here */
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
    // this.requestUpdate('latestSelection');
  }

  addSelectionToList(): void {
    if (!this.latestSelection) return;
    this.selections = [...this.selections, this.latestSelection];
    this.latestSelection = undefined;
  }

  deleteSelection(index: number): void {
    this.selections = [
      ...this.selections.slice(0, index),
      ...this.selections.slice(index + 1),
    ];
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
  }

  render(): TemplateResult {
    return html`
      <div>
        <span>
          ${this.latestSelection
            ? convertListEntryToHighlightSelectionText(this.latestSelection)
            : 'Nothing selected yet'}</span
        >
        ${this.latestSelection
          ? html`<button @click="${this.addSelectionToList}">
              Add to List
            </button>`
          : ''}
      </div>
      <ul>
        ${this.selections.map(
          (selection, index) => html`
            <li>
              <div>
                ${'columns' in selection
                  ? html` <input
                      type="checkbox"
                      .checked=${selection.fullLine}
                      @change=${() => this.toggleFullLine(index)}
                    />`
                  : nothing}
                ${convertListEntryToHighlightSelectionText(selection)}
              </div>
              <button @click="${() => this.deleteSelection(index)}">
                Delete
              </button>
              <button @click="${() => this.moveSelection(index, 'up')}">
                Move Up
              </button>
              <button @click="${() => this.moveSelection(index, 'down')}">
                Move Down
              </button>
            </li>
          `
        )}
      </ul>
    `;
  }

  toggleFullLine(index: number): void {
    const selection = this.selections[index];
    if (selection && 'columns' in selection) {
      selection.fullLine = !selection.fullLine;
      this.requestUpdate();
    }
  }
}

function parseSelection(selection: SelectionDetail): ListEntry {
  const {startPosition, endPosition} = selection;
  if (startPosition.row === endPosition.row) {
    return {
      start: startPosition.row,
      columns: [{from: startPosition.position, to: endPosition.position}],
      fullLine: false,
    };
  } else {
    return {
      start: startPosition.row,
      end: endPosition.row,
    };
  }
}

function convertListEntryToHighlightSelectionText(
  selection: ListEntry
): string {
  if ('end' in selection) {
    return `${selection.start}-${selection.end}`;
  }
  if ('columns' in selection) {
    if (selection.fullLine) {
      return `${selection.start}`;
    }
    return `${selection.start}:${selection.columns
      .map(column => `${column.from}-${column.to}`)
      .join(',')}`;
  }
  return `${selection.start}`;
}
