/* eslint-disable @typescript-eslint/ban-ts-comment */
import hljs from 'highlight.js';
import {
  Api,
  HighlightConfig as OriginalHighlightConfig,
  Plugin,
} from 'reveal.js';
import {prepareCodeBlock} from './code-editing';
import {
  deserializeHighlightDefinitions,
  serializeHighlightSection,
} from './serialize';
import {highlightLines} from './highlight';

// fix error in the reveal.js types
interface HighlightConfig extends OriginalHighlightConfig {
  escapeHTML?: boolean;
}

type ParsedConfig = ReturnType<HighlightPlugin['getConfig']>;

export class HighlightPlugin implements Plugin {
  readonly id = 'highlight';
  private reveal!: Api;

  private lineNumberImport;

  constructor() {
    // @ts-ignore
    globalThis.hljs = hljs;

    // must be loaded dynamically to ensure that the line above is executed before the iife is invoked
    // @ts-ignore
    this.lineNumberImport = import('highlightjs-line-numbers.js');
  }

  async init(reveal: Api) {
    await this.lineNumberImport;
    this.reveal = reveal;
    const config = this.getConfig();
    const codeBlocks = this.getCodeBlocks();

    this.prepareCodeBlocks(config, codeBlocks);

    // Triggers a callback function before we trigger highlighting
    if (typeof config.beforeHighlight === 'function') {
      config.beforeHighlight(hljs);
    }

    // Run initial highlighting for all code
    if (config.highlightOnLoad) {
      for (const block of codeBlocks) {
        await createFrameCodeBlocks(block);
      }
    }

    // If we're printing to PDF, scroll the code highlights of
    // all blocks in the deck into view at once
    // reveal.on('pdf-ready', function () {
    //   [].slice
    //     .call(
    //       reveal
    //         .getRevealElement()
    //         .querySelectorAll('pre code[data-line-numbers].current-fragment')
    //     )
    //     .forEach(function (block) {
    //       HighlightPlugin.scrollHighlightedLineIntoView(block, {}, true);
    //     });
    // });
  }

  private getConfig() {
    const config: HighlightConfig = this.reveal.getConfig().highlight || {};
    return {
      ...config,
      highlightOnLoad:
        typeof config.highlightOnLoad === 'boolean'
          ? config.highlightOnLoad
          : true,
      escapeHTML:
        typeof config.escapeHTML === 'boolean' ? config.escapeHTML : true,
    } as const;
  }

  private getCodeBlocks() {
    return (
      this.reveal
        .getRevealElement()
        ?.querySelectorAll<HTMLElement>('pre code') ?? []
    );
  }

  private prepareCodeBlocks(
    config: ParsedConfig,
    codeBlocks: Iterable<HTMLElement>
  ) {
    for (const block of codeBlocks) {
      if (block.parentNode) {
        (block.parentNode as HTMLElement).classList.add('code-wrapper');
      }

      prepareCodeBlock(block, config.escapeHTML);

      // Re-highlight when focus is lost (for contenteditable code)
      block.addEventListener(
        'focusout',
        function () {
          hljs.highlightElement(block);
        },
        false
      );
    }
  }
}

/**
 * Highlights a code block. If the <code> node has the
 * 'data-line-numbers' attribute we also generate slide
 * numbers.
 *
 * If the block contains multiple line highlight steps,
 * we clone the block and create a fragment for each step.
 */
async function createFrameCodeBlocks(block: HTMLElement) {
  if (block.innerHTML.trim().length === 0) {
    // nothing to do
    return;
  }

  const highlightDefinition = deserializeHighlightDefinitions(
    block.getAttribute('data-code-config')
  );
  if (typeof highlightDefinition === 'string') {
    console.error('Code block config error: ' + highlightDefinition, block);
    return;
  }

  // do not highlight the code if there is an error in the config
  hljs.highlightElement(block);

  if (highlightDefinition.showLineNumber) {
    if (highlightDefinition.offset) {
      block.setAttribute(
        'data-ln-start-from',
        String(highlightDefinition.offset)
      );
    }
    block.setAttribute('data-show-line-numbers', 'true');
  }

  // without this, the code is not in a table
  hljs.lineNumbersBlock(block, {singleLine: true});
  await waitForTableInElement(block);

  block.querySelectorAll<HTMLElement>('.hljs-ln-numbers').forEach(element => {
    element.classList.add('hidden');
  });

  if (highlightDefinition.highlightSections.length === 0) {
    return;
  }

  if (highlightDefinition.highlightSections.length === 1) {
    block.setAttribute(
      'data-highlight-sections',
      serializeHighlightSection(highlightDefinition.highlightSections[0])
    );
  }
  // todo create may code blocks
  if (highlightDefinition.highlightSections.length > 1) {
    return;
  }

  // const scrollState = {currentBlock: block};

  // Scroll the first highlight into view when the slide
  // becomes visible. Note supported in IE11 since it lacks
  // support for Element.closest.
  // const slide =
  //   typeof block.closest === 'function'
  //     ? block.closest('section:not(.stack)')
  //     : null;
  // if (slide) {
  //   const scrollFirstHighlightIntoView = function () {
  //     HighlightPlugin.scrollHighlightedLineIntoView(block, scrollState, true);
  //     slide.removeEventListener('visible', scrollFirstHighlightIntoView);
  //   };
  //   slide.addEventListener('visible', scrollFirstHighlightIntoView);
  // }

  highlightLines(block, highlightDefinition.highlightSections[0]);
}

// function applyFrameIndex(
//   block: HTMLElement,
//   frameDefinitions: FrameDefinition[]
// ) {
//   // If the original code block has a fragment-index,
//   // each clone should follow in an incremental sequence
//   const index = block.getAttribute('data-fragment-index');
//   const fragmentIndex =
//     index !== null && !isNaN(parseInt(index, 10)) ? parseInt(index, 10) : null;

//   // Generate fragments for all steps except the original block
//   frameDefinitions.slice(1).forEach(function (highlight) {
//     const fragmentBlock = block.cloneNode(true);
//     fragmentBlock.setAttribute(
//       'data-line-numbers',
//       HighlightPlugin.serializeHighlightSteps([highlight])
//     );
//     fragmentBlock.classList.add('fragment');
//     block.parentNode.appendChild(fragmentBlock);
//     HighlightPlugin.highlightLines(fragmentBlock);

//     if (typeof fragmentIndex === 'number') {
//       fragmentBlock.setAttribute('data-fragment-index', fragmentIndex);
//       fragmentIndex += 1;
//     } else {
//       fragmentBlock.removeAttribute('data-fragment-index');
//     }

//     // Scroll highlights into view as we step through them
//     fragmentBlock.addEventListener(
//       'visible',
//       HighlightPlugin.scrollHighlightedLineIntoView.bind(
//         HighlightPlugin,
//         fragmentBlock,
//         scrollState
//       )
//     );
//     fragmentBlock.addEventListener(
//       'hidden',
//       HighlightPlugin.scrollHighlightedLineIntoView.bind(
//         HighlightPlugin,
//         fragmentBlock.previousSibling,
//         scrollState
//       )
//     );
//   });

//   block.removeAttribute('data-fragment-index');
//   block.setAttribute(
//     'data-line-numbers',
//     HighlightPlugin.serializeHighlightSteps([frameDefinitions[0]])
//   );
// }

function waitForTableInElement(element: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    function checkForTable() {
      if (element.querySelector('table')) {
        resolve();
      } else {
        window.requestAnimationFrame(checkForTable);
      }
    }

    checkForTable();
  });
}
