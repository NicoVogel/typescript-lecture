import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';

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

@customElement('code-selection-emitter')
export class CodeSelectionEmitter extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('mouseup', this.handleSelectionChange);
    this.addEventListener('keyup', this.handleSelectionChange);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('mouseup', this.handleSelectionChange);
    this.removeEventListener('keyup', this.handleSelectionChange);
  }

  private handleSelectionChange(): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const startContainer = range.startContainer as Element;
      const endContainer = range.endContainer as Element;

      const startPosition = this.calculatePosition(
        startContainer,
        range.startOffset
      );
      const endPosition = this.calculatePosition(endContainer, range.endOffset);

      if (startPosition && endPosition) {
        const event = new CustomEvent('code-selection', {
          detail: {startPosition, endPosition},
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(event);
      }
    }
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

  protected render() {
    return html`<slot></slot>`;
  }
}
