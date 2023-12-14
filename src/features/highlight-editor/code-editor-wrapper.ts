import {LitElement, html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';

@customElement('code-editor-wrapper')
export class CodeEditorWrapper extends LitElement {
  @state() private isCodeEditActive: boolean = false;

  static get styles() {
    return css`
      :host {
        display: grid;
        grid-template-areas: 'presentation';
        grid-template-columns: 1fr;
        height: 100vh; /* Full viewport height */
        overflow: hidden; /* Prevents overflow */
      }

      :host([code-edit-active]) {
        grid-template-areas: 'codeSelection presentation';
        grid-template-columns: 1fr 1fr; /* Split the view into two equal columns */
      }

      #presentationContainer {
        grid-area: presentation;
        overflow: auto; /* Allows internal scrolling */
      }

      #codeSelectionManager {
        grid-area: codeSelection;
        display: none; /* Initially hidden */
        overflow: auto; /* Allows internal scrolling */
      }

      :host([code-edit-active]) #codeSelectionManager {
        display: block; /* Display when code-edit-active is true */
      }
    `;
  }

  constructor() {
    super();
    document.body.addEventListener(
      'code-edit-active',
      (event: CustomEvent<boolean>) => {
        this.isCodeEditActive = event.detail;
        this.toggleAttribute('code-edit-active', this.isCodeEditActive);
      }
    );
  }

  render() {
    // todo: show clone of code instead of presentation
    return html`
      <div id="presentationContainer">
        <slot></slot>
      </div>
      <div id="codeSelectionManager">
        <code-selection-manager></code-selection-manager>
      </div>
    `;
  }
}
