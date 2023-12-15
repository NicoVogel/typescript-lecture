import {LitElement, html, css} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import {createFragmentCodeBlocks} from '../../plugins/highlight/plugin';
import lightThemeUrl from 'highlight.js/styles/github.css?url';

export type SelectionPosition = {
  row: number;
  position: number;
};

export type SelectionDetail = {
  startPosition: SelectionPosition;
  endPosition: SelectionPosition;
};

declare global {
  interface HTMLElementEventMap {
    'code-selection': CustomEvent<SelectionDetail>;
  }
}

@customElement('code-editor-wrapper')
export class CodeEditorWrapper extends LitElement {
  static get styles() {
    return css`
      :host([code-edit-active]) {
        display: flex;
        flex-direction: column;
      }
    `;
  }

  @state() private isCodeEditActive = false;
  private code = '';
  @query('code') private codeElement?: HTMLElement;
  private presentation!: HTMLElement;

  constructor() {
    super();
    this.presentation = document.querySelector('.reveal')!;
    document.body.addEventListener('code-edit-active', event => {
      this.isCodeEditActive = event.detail.active;
      if (event.detail.active) {
        this.code = event.detail.code;
      }
      this.toggleAttribute('code-edit-active', this.isCodeEditActive);
      this.presentation.style.display = this.isCodeEditActive
        ? 'none'
        : 'block';
    });
  }

  protected updated(
    changedProperties: Map<string | number | symbol, unknown>
  ): void {
    super.updated(changedProperties);
    if (this.codeElement) {
      createFragmentCodeBlocks(this.codeElement);
      this.addEventListener('mouseup', this.handleSelectionChange);
      this.addEventListener('keyup', this.handleSelectionChange);
    }
  }

  render() {
    if (!this.isCodeEditActive) {
      return html`<slot></slot>`;
    }
    return html`<link
        rel="stylesheet"
        href="${lightThemeUrl}"
        data-theme="highlightjs"
      />
      <code-selection-manager></code-selection-manager>
      <pre>
          <code class="typescript hljs language-typescript">${this.code}</code>
          </pre> `;
  }

  private handleSelectionChange(): void {
    if (
      !('getSelection' in this.shadowRoot!) ||
      typeof this.shadowRoot!.getSelection !== 'function'
    ) {
      console.error(
        'You are probably not using chrome as the shadowRoot has no getSelection method'
      );
      return;
    }

    const selection = this.shadowRoot.getSelection();
    if (!selection && selection instanceof Selection) {
      return;
    }
    ``;
    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer as Element;
    const endContainer = range.endContainer as Element;
    const startPosition = this.calculatePosition(
      startContainer,
      range.startOffset
    );
    const endPosition = this.calculatePosition(endContainer, range.endOffset);

    if (!startPosition || !endPosition) {
      return;
    }

    const event = new CustomEvent('code-selection', {
      detail: {startPosition, endPosition},
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  private calculatePosition(
    container: Element,
    offset: number
  ): SelectionPosition | null {
    let node = container;
    let position = offset;

    while (node && node.nodeName !== 'TR') {
      if (node.previousSibling) {
        node = node.previousSibling as Element;
        position += node.textContent?.length || 0;
      } else {
        node = node.parentNode as Element;
      }
    }

    if (node && node.nodeName === 'TR') {
      const row = Array.from(node.parentNode!.children).indexOf(node) + 1;
      return {row, position};
    }

    return null;
  }
}
