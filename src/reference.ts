import intro from './slides/intro.md';
import overview from './slides/overview.md';
import test from './slides/test.md';
import agenda from './slides/agenda.md';
import example from './slides/example.md';
import sideBySide from './slides/side-by-side.md';

// addMarkdownSlides(agenda);
// addMarkdownSlides(sideBySide);
// addMarkdownSlides(example);
// addMarkdownSlides(intro);
// addMarkdownSlides(overview);
addMarkdownSlides(test);

function addMarkdownSlides(path: string): void {
  const slides = getSlidesDiv();

  const baseUrl = getBaseURL();
  const fullPath = concatenatePaths(baseUrl, path);

  const next = document.createElement('section');
  next.setAttribute('data-markdown', fullPath);
  next.setAttribute('data-separator', '^-----\\n');
  next.setAttribute('data-separator-vertical', '^---\\n');
  next.setAttribute('data-separator-notes', '^{{Notes}}\\n');
  next.setAttribute('data-charset', 'iso-8859-15');

  slides.appendChild(next);
}

function concatenatePaths(first: string, second: string): string {
  // Trim any trailing slashes from the first path and leading slashes from the second path
  const trimmedFirst = first.replace(/\/+$/, '');
  const trimmedSecond = second.replace(/^\/+/, '');

  // Concatenate the two paths, ensuring a single slash between them
  return `${trimmedFirst}/${trimmedSecond}`;
}

function getBaseURL(): string {
  const base = document.querySelector('base');
  return base ? base.getAttribute('href') || '' : '';
}

function getSlidesDiv() {
  const slides = [...document.getElementsByClassName('slides')][0];
  if (!slides) {
    throw new Error('Could not find <div class="slides">');
  }
  return slides;
}
