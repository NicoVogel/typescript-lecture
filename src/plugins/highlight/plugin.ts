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
        await createFragmentCodeBlocks(block);
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
async function createFragmentCodeBlocks(block: HTMLElement) {
  if (block.innerHTML.trim().length === 0) {
    // nothing to do
    return;
  }

  const highlightDefinition = deserializeHighlightDefinitions(
    block.getAttribute('data-code-config')
  );
  block.removeAttribute('data-code-config');
  if (typeof highlightDefinition === 'string') {
    console.error('Code block config error: ' + highlightDefinition, block);
    return;
  }

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

  // without this, the <code> does not contain a table with a row for each line
  hljs.lineNumbersBlock(block, {singleLine: true});
  await waitForTableInElement(block);

  if (!highlightDefinition.showLineNumber) {
    block.querySelectorAll<HTMLElement>('.hljs-ln-numbers').forEach(element => {
      element.classList.add('hidden');
    });
  }

  if (highlightDefinition.highlightSections.length === 0) {
    return;
  }

  const scrollHandler = new ScrollHandler(block);
  const fragmentHandler = new FragmentIndexHandler(block);
  block.removeAttribute('data-fragment-index');

  // create code blocks
  highlightDefinition.highlightSections
    .map((section, index) => {
      if (index === 0) {
        return [section, block] as const;
      }
      const fragmentBlock = block.cloneNode(true) as HTMLElement;
      fragmentHandler.applyFrameIndex(fragmentBlock);
      fragmentBlock.classList.add('fragment', 'fade-in-then-out');
      block.parentNode?.appendChild(fragmentBlock);
      return [section, fragmentBlock] as const;
    })
    // apply highlight
    .forEach(([section, block]) => {
      block.setAttribute(
        'data-line-numbers',
        serializeHighlightSection(section)
      );
      highlightLines(block, section);
      block.addEventListener('visible', () =>
        scrollHandler.scrollHighlightedLineIntoView(block)
      );
      block.addEventListener('hidden', () =>
        scrollHandler.scrollHighlightedLineIntoView(block.previousSibling)
      );
    });

  const slide = block.closest('section:not(.stack)');
  if (!slide) {
    return;
  }
  slide.setAttribute('data-fragment', '0');
  slide.addEventListener(
    'visible',
    () => scrollHandler.scrollHighlightedLineIntoView(block, true),
    {
      once: true,
    }
  );
}

class FragmentIndexHandler {
  private readonly active;
  private value;
  constructor(block: HTMLElement) {
    const original = block.getAttribute('data-fragment-index');
    this.value = parseInt(original ?? '0', 10);
    this.active = original !== null && !isNaN(this.value);
  }

  applyFrameIndex(block: HTMLElement) {
    if (!this.active) return;
    block.setAttribute('data-fragment-index', String(this.value));
    this.value++;
  }
}

export class ScrollHandler {
  private scrollState;

  constructor(block: HTMLElement) {
    this.scrollState = {currentBlock: block, animationFrameID: 0};
  }

  /**
   * Animates scrolling to the first highlighted line
   * in the given code block.
   */
  scrollHighlightedLineIntoView(
    block: ChildNode | null,
    skipAnimation?: boolean
  ) {
    if (!block || !(block instanceof HTMLElement)) return;
    cancelAnimationFrame(this.scrollState.animationFrameID);

    // Match the scroll position of the currently visible
    // code block
    if (this.scrollState.currentBlock) {
      block.scrollTop = this.scrollState.currentBlock.scrollTop;
    }

    // Remember the current code block so that we can match
    // its scroll position when showing/hiding fragments
    this.scrollState.currentBlock = block;

    const highlightBounds = this.getHighlightedLineBounds(block);
    let viewportHeight = block.offsetHeight;

    // Subtract padding from the viewport height
    const blockStyles = getComputedStyle(block);
    viewportHeight -=
      parseInt(blockStyles.paddingTop) + parseInt(blockStyles.paddingBottom);

    // Scroll position which centers all highlights
    const startTop = block.scrollTop;
    let targetTop =
      highlightBounds.top +
      (Math.min(highlightBounds.bottom - highlightBounds.top, viewportHeight) -
        viewportHeight) /
        2;

    // Account for offsets in position applied to the
    // <table> that holds our lines of code
    const lineTable = block.querySelector<HTMLElement>('.hljs-ln');
    if (lineTable)
      targetTop += lineTable.offsetTop - parseInt(blockStyles.paddingTop);

    // Make sure the scroll target is within bounds
    targetTop = Math.max(
      Math.min(targetTop, block.scrollHeight - viewportHeight),
      0
    );

    if (skipAnimation === true || startTop === targetTop) {
      block.scrollTop = targetTop;
    } else {
      // Don't attempt to scroll if there is no overflow
      if (block.scrollHeight <= viewportHeight) return;

      let time = 0;
      const animate = () => {
        time = Math.min(time + 0.02, 1);

        // Update our eased scroll position
        block.scrollTop =
          startTop + (targetTop - startTop) * this.easeInOutQuart(time);

        // Keep animating unless we've reached the end
        if (time < 1) {
          this.scrollState.animationFrameID = requestAnimationFrame(animate);
        }
      };

      animate();
    }
  }

  /**
   * The easing function used when scrolling.
   */
  private easeInOutQuart(t: number) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
  }

  private getHighlightedLineBounds(block: HTMLElement) {
    const highlightedLines =
      block.querySelectorAll<HTMLElement>('.highlight-line');
    if (highlightedLines.length === 0) {
      return {top: 0, bottom: 0};
    } else {
      const firstHighlight = highlightedLines[0];
      const lastHighlight = highlightedLines[highlightedLines.length - 1];

      return {
        top: firstHighlight.offsetTop,
        bottom: lastHighlight.offsetTop + lastHighlight.offsetHeight,
      };
    }
  }
}

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
