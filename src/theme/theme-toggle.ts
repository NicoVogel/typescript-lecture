class ThemeToggleSlider extends HTMLElement {
  private slider: HTMLDivElement;

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.slider = document.createElement('div');
    this.initializeTheme();
    this.createSlider();
  }

  connectedCallback() {
    this.updateTheme();
  }

  createSlider() {
    this.slider.innerHTML = `
            <style>
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
                    justify-content: ${
                      this.isDarkMode() ? 'flex-start' : 'flex-end'
                    };
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
                    transition: background-color 0.3s ease, color 0.3s ease;
                }
            </style>
            <div class="theme-toggle">
                <div class="theme-toggle-icon">${
                  this.isDarkMode() ? '🌙' : '☀'
                }</div>
            </div>
        `;
    this.shadowRoot?.appendChild(this.slider);
    this.slider
      .querySelector('.theme-toggle')
      ?.addEventListener('click', this.toggleTheme.bind(this));
  }

  initializeTheme() {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    if (storedTheme) {
      document.body.classList.toggle('dark', storedTheme === 'dark');
    } else if (prefersDark) {
      document.body.classList.add('dark');
    }
  }

  isDarkMode(): boolean {
    return document.body.classList.contains('dark');
  }

  toggleTheme(): void {
    const isDark = !this.isDarkMode();
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.updateTheme();
  }

  updateTheme(): void {
    const isDark = this.isDarkMode();
    this.slider.querySelector<HTMLElement>(
      '.theme-toggle'
    )!.style.justifyContent = isDark ? 'flex-start' : 'flex-end';
    this.slider.querySelector('.theme-toggle-icon')!.textContent = isDark
      ? '🌙'
      : '☀';
  }
}

customElements.define('theme-toggle-slider', ThemeToggleSlider);
