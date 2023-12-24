import {LitElement, html, css} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import {createFragmentCodeBlocks} from '../../plugins/highlight/plugin';
import lightThemeUrl from 'highlight.js/styles/github.css?url';
import {createEvent} from '../typesafe-events';

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
      :host([editing-code]) {
        display: flex;
        flex-direction: column;
      }

      code {
        max-height: 60rem;
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
    console.assert(this.presentation, 'Reveal.js not found');

    this.presentation.addEventListener('ready', () => {
      console.log('reveal.js ready');
      this.wrapCodeBlocks();
    });

    this.addEventListener('code-edit', event => {
      this.code = event.detail.code;
      this.showEditor();
    });
  }

  private showPresentation() {
    this.isCodeEditActive = false;
    this.toggleAttribute('editing-code', false);
    this.presentation.style.display = 'block';
  }

  private showEditor() {
    this.isCodeEditActive = true;
    this.toggleAttribute('editing-code', true);
    this.presentation.style.display = 'none';
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
      <button @click="${() => this.showPresentation()}">Exit</button>
      <code-selection-manager></code-selection-manager>
      <pre>
          <code class="typescript hljs language-typescript">${this.code}</code>
          </pre> `;
  }

  private wrapCodeBlocks() {
    const codeBlocks = this.presentation.querySelectorAll('pre');

    codeBlocks.forEach(code => {
      const wrapper = document.createElement('code-edit-button');
      code.parentNode!.insertBefore(wrapper, code);
      wrapper.appendChild(code);
    });
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

    this.dispatchEvent(
      createEvent('code-selection', {startPosition, endPosition})
    );
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
