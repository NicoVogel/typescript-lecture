/* eslint-disable @typescript-eslint/ban-ts-comment */
import Reveal from 'reveal.js';
import Markdown from './plugins/markdown/plulgin';
import Highlight from './plugins/highlight';
// @ts-ignore
import Notes from 'reveal.js/plugin/notes/notes.esm.js';
// import Highlight from 'reveal.js/plugin/highlight/highlight.esm.js';

import 'reveal.js/dist/reset.css';
import 'reveal.js/dist/reveal.css';

import './reference';
import './theme/theme.scss';
import './layouts/agenda.scss';
import './layouts/side-by-side.scss';
import './layouts/inline-code.scss';

import './features/theme-swap';
import './features/highlight-editor';

Reveal.initialize({
  hash: true,
  plugins: [Markdown, Highlight, Notes],
});
