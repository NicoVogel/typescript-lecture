import {PluginOption, defineConfig} from 'vite';

export default defineConfig({
  plugins: [markdownImagePlugin()],
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
      async handler(code, id) {
        if (path.extname(id) !== '.md') {
          return null;
        }
        // Parse the Markdown file
        const tokens = marked.lexer(code);

        const update = async (tokens: Token[]): Promise<string> => {
          let updatedFile = '';
          for (const token of tokens) {
            if (token.type !== 'image') {
              // construct the markdown file
              if ('tokens' in token && token.tokens) {
                updatedFile += await update(token.tokens);
              } else {
                updatedFile += token.raw;
              }
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
            updatedFile += updatedImage;
          }
          return updatedFile;
        };
        const source = await update(tokens);

        //emit the markdown file as an asset
        this.emitFile({
          type: 'asset',
          fileName: `slides/${path.basename(id)}`,
          source,
        });

        // return an default exported string that contains the path to the markdown file
        return `export default "/slides/${path.basename(id)}";`;
      },
    },
  };
}
