import intro from './slides/intro.md?url';
import overview from './slides/overview.md?url';
import test from './slides/test.md?url';

addMarkdownSlides(intro);
addMarkdownSlides(overview);
addMarkdownSlides(test);

function addMarkdownSlides(path: string): void {
  const slides = getSlidesDiv();

  const next = document.createElement('section');
  next.setAttribute('data-markdown', path);
  next.setAttribute('data-separator', '^-----\\n');
  next.setAttribute('data-separator-vertical', '^---\\n');
  next.setAttribute('data-separator-notes', '^{{Notes}}\\n');
  next.setAttribute('data-charset', 'iso-8859-15');

  slides.appendChild(next);
}

function getSlidesDiv() {
  const slides = [...document.getElementsByClassName('slides')][0];
  if (!slides) {
    throw new Error('Could not find <div class="slides">');
  }
  return slides;
}
