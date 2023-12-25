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
import {Selection, Selections} from './selection';
import {GetEvent} from '../typesafe-events';

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
  private selections = new Selections(() => {
    this.requestUpdate('selections');
  });
  @state() private latestSelection?: Selection;

  static get styles(): CSSResultGroup {
    return css`
      pre {
        margin: 0;
      }

      :host {
        font-family: 'Geist Sans', Helvetica, sans-serif;
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
        background-color: var(--r-theme-dark-shades);
      }

      ul {
        list-style-type: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
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
        width: 80%;
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

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--r-theme-dark-shades);
        margin-bottom: 0.5rem;
        height: 2.5rem;
        gap: 1rem;
      }

      .header > div {
        background-color: var(--r-theme-light-shades);
        flex-grow: 1;
        height: 100%;
        display: flex;
        align-items: center;
        padding-left: 1rem;
        gap: 1rem;
        border-radius: 0.5rem;
      }

      .action-button {
        display: flex;
        align-items: center;
        border: none;
        height: 100%;
        padding: 0 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .action-button[disabled] {
        cursor: not-allowed;
        background-color: var(--r-theme-light-shades);
        color: var(--r-theme-dark-shades);
      }

      .selection-bar {
        height: 2.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        justify-content: space-between;
      }

      .selection-bar > div {
        background-color: var(--r-theme-light-shades);
        flex-grow: 1;
        height: 100%;
        display: flex;
        align-items: center;
        padding-left: 1rem;
        gap: 1rem;
        border-radius: 0.5rem;
      }

      .selection-bar > div > pre {
        /* dont know why this is needed to center the text */
        display: flex;
        height: 100%;
        flex-direction: column-reverse;
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
    this.latestSelection = new Selection(event.detail);
  }

  render(): TemplateResult {
    return html`
      ${this.renderHeader()}
      <ul>
        ${[...this.selections].map((selection, index) =>
          this.renderListElement(selection, index)
        )}
      </ul>
    `;
  }

  private renderHeader() {
    return html` <div>
      <div class="header">
        <div>
          <div>Animation:</div>
          <pre>${this.selections.toString()}</pre>
        </div>
        <button class="action-button" @click="${this.copyToClipboard}">
          <reveal-icon icon="clipboard"></reveal-icon>
        </button>
      </div>
      <div class="selection-bar">
        <button
          class="action-button"
          ?disabled="${this.latestSelection === undefined}"
          @click="${this.addSelectionToList}"
        >
          <reveal-icon icon="plus"></reveal-icon>
        </button>
        <div>
          <pre>
          ${this.latestSelection
              ? this.latestSelection.toString()
              : 'Nothing selected yet'}
        </pre
          >
        </div>
        <button
          class="action-button"
          @click="${() => this.selections.addSeparator()}"
        >
          Add Separator
        </button>
      </div>
    </div>`;
  }

  private renderListElement(selection: Selection, index: number) {
    const text = selection.isSeparator ? 'Separator' : selection.toString();
    return html`<li class="list-item">
      <pre class="item-text">${text}</pre>
      ${selection.isColumn
        ? html` <comp-slider
            class="slider"
            ?isActive=${selection.fullLine}
            @slider-change=${(e: GetEvent<'slider-change'>) =>
              this.selections.changeFullLine(index, e.detail.active)}
          ></comp-slider>`
        : nothing}
      <div class="move-container">
        <button
          class="move-button"
          @click="${() => this.selections.moveSelection(index, 'up')}"
        >
          <reveal-icon icon="arrow-up" size="small"></reveal-icon>
        </button>
        <button
          class="move-button"
          @click="${() => this.selections.moveSelection(index, 'down')}"
        >
          <reveal-icon icon="arrow-down" size="small"></reveal-icon>
        </button>
      </div>
      <button
        class="delete-button"
        @click="${() => this.selections.deleteSelection(index)}"
      >
        <reveal-icon icon="delete" size="small"></reveal-icon>
      </button>
    </li>`;
  }

  private addSelectionToList(): void {
    if (!this.latestSelection) return;
    this.selections.addSelection(this.latestSelection);
    this.latestSelection = undefined;
  }

  private copyToClipboard(): void {
    const textToCopy = this.selections.toString();
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
