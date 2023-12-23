import {defineConfig} from 'vite';
import markdownImagePlugin from './src/features/vite-markdown-image-importer-plugin';

export default defineConfig({
  plugins: [markdownImagePlugin()],
  base: './',
  build: {
    minify: false,
  },
});
