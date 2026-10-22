// @ts-check
// The Astro config every site shares; each site's astro.config.mjs is
// `export default gardenConfig({ root: new URL('.', import.meta.url), redirects })`.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import pagefind from 'astro-pagefind';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadProject } from './lib/files.ts';
import { wikiRehypePlugins, wikiRemarkPlugins } from './lib/markdown/index.ts';
import { sitemapOptions } from './lib/sitemap.ts';

const gardenRoot = fileURLToPath(new URL('.', import.meta.url));

/**
 * @param {object} options
 * @param {URL} options.root the site's folder (sites/<site>/)
 * @param {Record<string, string>} [options.redirects] old addresses and where they go
 */
export function gardenConfig({ root: rootUrl, redirects = {} }) {
  const root = fileURLToPath(rootUrl);
  // The content and data from disk, for what config needs before Astro loads its
  // collections: the [[wiki link]] title index (read once: restart `astro dev`
  // after renaming a page) and the sitemap's entries.
  const project = loadProject(root);
  const { site, titles } = project;

  return defineConfig({
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
    integrations: [sitemap(sitemapOptions(project)), pagefind()],
    vite: {
      plugins: [tailwindcss()],
      // garden/lib/paths.ts: bundled code's import.meta.url points into dist/, so the folders come from here.
      define: {
        'import.meta.env.PROJECT_ROOT': JSON.stringify(root),
        'import.meta.env.GARDEN_ROOT': JSON.stringify(gardenRoot),
      },
    },
    redirects,
  });
}
