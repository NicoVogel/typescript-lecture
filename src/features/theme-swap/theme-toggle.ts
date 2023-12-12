import {LitElement, html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';

@customElement('theme-toggle-slider')
export class ThemeToggleSlider extends LitElement {
  @state() private isDarkMode: boolean;

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
        position: fixed;
        top: 10px;
        right: 10px;
        width: 50px;
        height: 24px;
        background-color: var(--r-theme-light-shades);
        border: 1px solid var(--r-theme-main-brand-color);
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        transition: justify-content 0.3s ease;
        z-index: 1000;
      }
      .theme-toggle-icon {
        width: 24px;
        height: 24px;
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
      .theme-toggle.dark {
        justify-content: flex-start;
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

  private toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  protected render() {
    return html`
      <div
        class="theme-toggle ${this.isDarkMode ? 'dark' : ''}"
        @click="${this.toggleTheme}"
      >
        <div class="theme-toggle-icon">${this.isDarkMode ? '🌙' : '☀'}</div>
      </div>
    `;
  }
}