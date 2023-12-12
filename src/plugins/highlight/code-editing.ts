export function prepareCodeBlock(block: HTMLElement, escapeHTML: boolean) {
  // Trim whitespace if the "data-trim" attribute is present
  if (
    block.hasAttribute('data-trim') &&
    typeof block.innerHTML.trim === 'function'
  ) {
    block.innerHTML = betterTrim(block);
  }

  // Escape HTML tags unless the "data-noescape" attrbute is present
  if (escapeHTML && !block.hasAttribute('data-noescape')) {
    block.innerHTML = block.innerHTML
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

function betterTrim(snippetEl: HTMLElement): string {
  const trimLeft = (val: string): string =>
    val.replace(/^[\s\uFEFF\xA0]+/g, '');

  const trimLineBreaks = (input: string): string => {
    const lines = input.split('\n');
    while (lines.length > 0 && lines[0].trim() === '') {
      lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }
    return lines.join('\n');
  };

  const content = trimLineBreaks(snippetEl.innerHTML);
  const lines = content.split('\n');

  const pad = lines.reduce((acc, line) => {
    const lineTrimmed = trimLeft(line);
    return lineTrimmed.length > 0 && acc > line.length - lineTrimmed.length
      ? line.length - lineTrimmed.length
      : acc;
  }, Number.POSITIVE_INFINITY);

  return lines.map(line => line.slice(pad)).join('\n');
}
