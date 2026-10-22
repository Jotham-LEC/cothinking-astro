// @ts-check
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import YAML from 'yaml';
import { wikiRehypePlugins, wikiRemarkPlugins } from './src/lib/markdown/index.ts';
import { redirectsFor } from './src/lib/redirects.ts';
import { sitemapOptions } from './src/lib/sitemap.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const read = (file) => fs.readFileSync(new URL(file, import.meta.url), 'utf8');

/** @type {import('./src/lib/types.ts').SiteConfig} */
const site = YAML.parse(read('./src/data/site.yaml'));
// The title index behind [[wiki links]], written by `npm run import` and `npm run check`.
const titles = JSON.parse(read('./src/data/titles.json'));

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
      rehypePlugins: wikiRehypePlugins({ publicDir: root + 'public' }),
    }),
    // No highlighter: code-blocks.js draws the chrome in the browser.
    syntaxHighlight: false,
  },
  integrations: [mdx(), sitemap(sitemapOptions(root)), pagefind()],
  vite: { plugins: [tailwindcss()] },
  redirects: redirectsFor(root),
});
