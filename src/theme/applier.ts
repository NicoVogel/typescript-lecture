// choose theme from here: https://highlightjs.org/examples
import lightThemeUrl from 'highlight.js/styles/github.css?url';
import darkThemeUrl from 'highlight.js/styles/github-dark.css?url';

// web component to toggle the theme
import './theme-toggle';

function loadStyleSheet(url: string): void {
  const existingLink = document.querySelector('link[data-theme="highlightjs"]');
  if (existingLink) {
    existingLink.setAttribute('href', url);
  } else {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.dataset.theme = 'highlightjs';
    document.head.appendChild(link);
  }
}

function applyTheme(): void {
  const isDarkMode = document.body.classList.contains('dark');
  loadStyleSheet(isDarkMode ? darkThemeUrl : lightThemeUrl);
}

// Observe changes to the class attribute of the body tag
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      applyTheme();
    }
  });
});

// Start observing
observer.observe(document.body, {attributes: true});

// Apply initial theme when the page is loaded
document.addEventListener('DOMContentLoaded', applyTheme);
