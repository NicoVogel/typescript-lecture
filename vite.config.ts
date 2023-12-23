import {defineConfig} from 'vite';
import markdownImagePlugin from './src/features/vite-markdown-image-importer-plugin';
import Checker from 'vite-plugin-checker';

export default defineConfig(({command}) => {
  return {
    plugins: [
      command === 'build' ? Checker({typescript: true}) : undefined,
      markdownImagePlugin(),
    ],
    base: './',
    build: {
      minify: false,
      rollupOptions: {
        input: {
          app: './index.html',
        },
      },
    },
    server: {
      open: './index.dev.html',
    },
  };
});
