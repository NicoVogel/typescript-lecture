/* eslint-disable @typescript-eslint/ban-ts-comment */
import Reveal from 'reveal.js';
// @ts-ignore
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
// @ts-ignore
import Highlight from 'reveal.js/plugin/highlight/highlight.esm.js';
// @ts-ignore
import Notes from 'reveal.js/plugin/notes/notes.esm.js';

import 'reveal.js/dist/reset.css';
import 'reveal.js/dist/reveal.css';
// choose theme from here: https://highlightjs.org/examples
import 'highlight.js/styles/github-dark.css';

import './reference';
import './theme/custom.scss';

Reveal.initialize({
  hash: true,
  plugins: [Markdown, Highlight, Notes],
});
