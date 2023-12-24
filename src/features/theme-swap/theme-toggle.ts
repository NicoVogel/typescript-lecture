import {LitElement, html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {GetEvent} from '../typesafe-events';

@customElement('theme-toggle-slider')
export class ThemeToggleSlider extends LitElement {
  @state() private isDarkMode = false;

  constructor() {
    super();
    this.isDarkMode = this.getInitialTheme();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.initializeTheme();
  }

  static get styles() {
    return css`
      .theme-toggle {
        z-index: 1000;
        position: fixed;
        top: 1rem;
        right: 1rem;
      }
    `;
  }

  private getInitialTheme(): boolean {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    return storedTheme ? storedTheme === 'dark' : prefersDark;
  }

  private initializeTheme(): void {
    document.body.classList.toggle('dark', this.isDarkMode);
  }

  private handleSlider(newState: boolean): void {
    this.isDarkMode = newState;
    document.body.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  protected render() {
    return html`
      <comp-slider
        @slider-change="${(e: GetEvent<'slider-change'>) =>
          this.handleSlider(e.detail.active)}"
        ?isActive="${this.isDarkMode}"
        class="theme-toggle"
      >
        <reveal-icon slot="disabled" icon="sun" size="small"></reveal-icon>
        <reveal-icon slot="enabled" icon="moon" size="small"></reveal-icon>
      </comp-slider>
    `;
  }
}
