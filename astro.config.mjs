// @ts-check
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadProject } from './src/lib/files.ts';
import { wikiRehypePlugins, wikiRemarkPlugins } from './src/lib/markdown/index.ts';
import { redirectsFor } from './src/lib/redirects.ts';
import { sitemapOptions } from './src/lib/sitemap.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
// The content and data from disk, for what config needs before Astro loads its collections.
const project = loadProject(root);
const { site } = project;
// The title index behind [[wiki links]], written by `npm run import` and `npm run check`.
const titles = JSON.parse(fs.readFileSync(new URL('./src/data/titles.json', import.meta.url), 'utf8'));

export default defineConfig({
  site: site.url,
  trailingSlash: 'never',
  build: { format: 'file' },
  markdown: {
    processor: unified({
      gfm: true,
      // Statamic had no SmartPunct: `--`, `...` and straight quotes stay as typed.
      smartypants: false,
      remarkPlugins: wikiRemarkPlugins({ titles, siteUrl: site.url }),
      rehypePlugins: wikiRehypePlugins({ siteUrl: site.url, publicDir: root + 'public' }),
    }),
    // No highlighter: code-blocks.js draws the chrome in the browser.
    syntaxHighlight: false,
  },
  integrations: [mdx(), sitemap(sitemapOptions(project)), pagefind()],
  vite: {
    plugins: [tailwindcss()],
    // src/lib/paths.ts: bundled code's import.meta.url points into dist/, so the root comes from here.
    define: { 'import.meta.env.PROJECT_ROOT': JSON.stringify(root) },
  },
  redirects: redirectsFor(project),
});
