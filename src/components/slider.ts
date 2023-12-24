import {LitElement, html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {createEvent} from '../features/typesafe-events';

export type SliderEvent = {
  active: boolean;
};

declare global {
  interface HTMLElementEventMap {
    'slider-change': CustomEvent<SliderEvent>;
  }
}

@customElement('comp-slider')
export class Slider extends LitElement {
  static get styles() {
    return css`
      .toggle {
        width: 3rem;
        height: 1.5rem;
        background-color: var(--r-theme-light-shades);
        border: 1px solid var(--r-theme-main-brand-color);
        border-radius: 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        transition: justify-content 0.3s ease;
      }
      .slider {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background-color: var(--r-theme-main-brand-color);
        color: var(--r-theme-light-shades);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition:
          background-color 0.3s ease,
          color 0.3s ease;
      }
      .toggle.active {
        justify-content: flex-start;
      }
    `;
  }

  @property({type: Boolean}) @state() isActive = false;

  private toggle(): void {
    this.isActive = !this.isActive;
    this.dispatchEvent(createEvent('slider-change', {active: this.isActive}));
  }

  protected render() {
    return html`
      <div
        class="toggle ${this.isActive ? 'active' : ''}"
        @click="${this.toggle}"
      >
        <div class="slider">
          ${this.isActive
            ? html`<slot name="enabled"></slot>`
            : html`<slot name="disabled"></slot>`}
        </div>
      </div>
    `;
  }
}
