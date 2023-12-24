import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {createEvent} from '../typesafe-events';

export type EditCodeEvent = {
  code: string;
};

declare global {
  interface HTMLElementEventMap {
    'code-edit': CustomEvent<EditCodeEvent>;
  }
}

@customElement('code-edit-button')
export class CodeEditWrapper extends LitElement {
  static get styles() {
    return css`
      :host {
        position: relative;
        display: block;
      }
      .edit-button {
        position: absolute;
        top: 0;
        left: 0;
        background-color: #f0f0f0;
        border: none;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      slot {
        display: block; /* Ensures the slot behaves like a block element */
      }
    `;
  }

  private emitEditEvent() {
    const codeContent = this.getCodeContent();
    this.dispatchEvent(
      createEvent('code-edit', {
        code: codeContent,
      })
    );
  }

  private getCodeContent(): string {
    const slotElement = this.shadowRoot?.querySelector('slot');
    const preElement = slotElement?.assignedElements()[0];
    const codeElement = preElement?.querySelector('code');
    return codeElement?.innerText?.trim() || '';
  }

  render() {
    return html`
      <button class="edit-button" @click="${this.emitEditEvent}">
        <reveal-icon icon="edit"></reveal-icon>
      </button>
      <slot></slot>
    `;
  }
}
