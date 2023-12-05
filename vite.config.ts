import {PluginOption, defineConfig} from 'vite';

export default defineConfig({
  plugins: [markdownImagePlugin()],
  base: './',
  build: {
    minify: false,
  },
});

import {Token, marked} from 'marked';
import fs from 'node:fs/promises';
import path from 'node:path';

function markdownImagePlugin(): PluginOption {
  return {
    name: 'markdown-image-plugin',
    transform: {
      order: 'pre',
      async handler(code, id, options) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const isBuild = !options ? true : options.command === 'build';
        if (path.extname(id) !== '.md') {
          return null;
        }
        // Parse the Markdown file
        const tokens = marked.lexer(code);

        const processTokens = async (tokens: Token[]): Promise<string> => {
          let updatedCode = '';
          for (const token of tokens) {
            if (token.type !== 'image') {
              // construct the markdown file
              if (token.type === 'paragraph') {
                updatedCode += await processTokens(token.tokens ?? []);
                updatedCode += '\n';
              } else {
                updatedCode += token.raw;
              }
              continue;
            }
            if (token.href.startsWith('http')) {
              // continue if the image is already a URL
              updatedCode += token.raw;
              continue;
            }

            const imagePath = path.resolve(path.dirname(id), token.href);

            if (!(await fs.stat(imagePath)).isFile()) {
              this.error(
                `Image not found: "${imagePath}" in markdown file "${id}"`
              );
            }

            // Emit the image file as an asset
            this.emitFile({
              type: 'asset',
              fileName: `images/${path.basename(imagePath)}`,
              source: await fs.readFile(imagePath),
            });

            // Modify the image path in the Markdown
            const updatedImage = token.raw.replace(
              token.href,
              `/images/${path.basename(imagePath)}`
            );
            updatedCode += updatedImage;
          }
          return updatedCode;
        };
        const updatedMarkdown = await processTokens(tokens);

        if (isBuild) {
          this.emitFile({
            type: 'asset',
            fileName: `slides/${path.basename(id)}`,
            source: updatedMarkdown,
          });
          return `export default "/slides/${path.basename(id)}";`;
        }

        // Convert the absolute path to a relative path
        const relativePath = path.relative(process.cwd(), id);
        return `export default "${relativePath}"`;
      },
    },
  };
}
