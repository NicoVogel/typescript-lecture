import {LitElement, html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';

export type CodeEditorToggleEvent =
  | {
      active: true;
      code: string;
    }
  | {
      active: false;
    };

declare global {
  interface HTMLElementEventMap {
    'code-edit-active': CustomEvent<CodeEditorToggleEvent>;
  }
}

@customElement('code-toggle-emitter')
export class CodeEditorToggle extends LitElement {
  @state() private isActive: boolean = false;

  static get styles() {
    return css`
      /* Your component styles go here */
      .toggle-switch {
        /* Style your toggle switch */
      }
    `;
  }

  toggleEmitter() {
    this.isActive = !this.isActive;
    if (!this.isActive) {
      this.dispatchEvent(
        new CustomEvent<CodeEditorToggleEvent>('code-edit-active', {
          detail: {
            active: false,
          },
          bubbles: true,
          composed: true,
        })
      );
    }

    const currentVisibleCode = this.getCurrentVisibleCode();

    if (!currentVisibleCode) {
      return;
    }

    const code = currentVisibleCode.innerText;
    if (this.isActive) {
      this.dispatchEvent(
        new CustomEvent<CodeEditorToggleEvent>('code-edit-active', {
          detail: {
            active: true,
            code,
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  getCurrentVisibleCode(): HTMLElement | null {
    const slidesContainer = document.querySelector('.reveal .slides');
    if (!slidesContainer) return null;
    const presentSlide =
      slidesContainer.querySelector<HTMLElement>('.present .present');
    if (!presentSlide) return null;

    const visibleCode = [...presentSlide.querySelectorAll<HTMLElement>('code')];
    if (visibleCode.length === 0) {
      return null;
    }
    if (visibleCode.length === 1) {
      return visibleCode[0];
    }

    const fragmentIndex = presentSlide.getAttribute('data-fragment');
    if (!fragmentIndex) return null;

    const codeIndex = parseInt(fragmentIndex, 10) + 1;
    return visibleCode[codeIndex] ?? null;
  }

  render() {
    return html`
      <div class="toggle-switch">
        <input
          type="checkbox"
          id="emitterToggle"
          @change="${this.toggleEmitter}"
          ?checked="${this.isActive}"
        />
        <label for="emitterToggle">Toggle Code Emitter</label>
      </div>
    `;
  }
}
