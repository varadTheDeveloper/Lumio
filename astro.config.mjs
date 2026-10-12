import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.lumio.example',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // three.js is one ~130 KB (gzip) chunk, loaded after the page has painted.
  vite: { build: { chunkSizeWarningLimit: 600 } },
});
