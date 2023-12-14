import {LitElement, html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';

declare global {
  interface HTMLElementEventMap {
    'code-edit-active': CustomEvent<boolean>;
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

    const currentVisibleCode = this.getCurrentVisibleCode();

    if (!currentVisibleCode) {
      return;
    }
    if (this.isActive) {
      const wrapper = document.createElement('code-selection-emitter');
      currentVisibleCode.parentNode?.insertBefore(wrapper, currentVisibleCode);
      wrapper.appendChild(currentVisibleCode);
      this.dispatchEvent(
        new CustomEvent<boolean>('code-edit-active', {
          detail: true,
          bubbles: true,
          composed: true,
        })
      );
    } else {
      const wrapper = currentVisibleCode.parentElement;
      if (wrapper && wrapper.tagName === 'CODE-SELECTION-EMITTER') {
        wrapper.parentNode?.insertBefore(currentVisibleCode, wrapper);
        wrapper.parentNode?.removeChild(wrapper);
        this.dispatchEvent(
          new CustomEvent<boolean>('code-edit-active', {
            detail: false,
            bubbles: true,
            composed: true,
          })
        );
      }
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
