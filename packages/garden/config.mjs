// @ts-check
// The Astro config every site shares; each site's astro.config.mjs calls
// `gardenConfig({ root, site, urlOf, otherSite, redirects })`.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import pagefind from 'astro-pagefind';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { wikiRehypePlugins, wikiRemarkPlugins } from './lib/markdown/index.ts';
import { codeBlock } from './lib/markdown/shiki-code-block.ts';
import { lazyTitles, scanEntries } from './lib/scan.ts';
import { sitemapOptions } from './lib/sitemap.ts';

const gardenRoot = fileURLToPath(new URL('.', import.meta.url));

/**
 * @param {object} options
 * @param {URL} options.root the site's folder (sites/<site>/)
 * @param {import('./lib/site.ts').SiteConfig} options.site the site's config (src/site.config.ts)
 * @param {import('./lib/entry.ts').UrlOf} options.urlOf the site's address rule (src/lib/urls.ts)
 * @param {{ root: URL, urlOf: import('./lib/entry.ts').UrlOf }} options.otherSite the other site's folder and address rule, for `[[wiki links]]` to its pages
 * @param {Record<string, string>} [options.redirects] old addresses and where they go
 */
export function gardenConfig({ root: rootUrl, site, urlOf, otherSite, redirects = {} }) {
  const root = fileURLToPath(rootUrl);
  // The `[[wiki link]]` title index, from both sites' content on disk: read once in a build, on every render in dev.
  const titles = lazyTitles({ root: rootUrl, urlOf }, { ...otherSite, url: site.otherSite.url });

  return defineConfig({
    site: site.url,
    trailingSlash: 'never',
    build: { format: 'file' },
    // Two page files for one address (a page in [slug].astro's list that has its own file too) fail the build.
    prerenderConflictBehavior: 'error',
    markdown: {
      processor: unified({
        gfm: true,
        // `--`, `...` and straight quotes stay as typed.
        smartypants: false,
        remarkPlugins: wikiRemarkPlugins({ titles, siteUrl: site.url }),
        rehypePlugins: wikiRehypePlugins({ siteUrl: site.url, publicDir: root + 'public' }),
      }),
      // Shiki in both modes (styles/site.css picks the colour by light-dark()), each block in its chrome.
      syntaxHighlight: { type: 'shiki' },
      shikiConfig: {
        themes: { light: 'gruvbox-light-soft', dark: 'gruvbox-dark-soft' },
        defaultColor: false,
        transformers: [codeBlock()],
      },
    },
    integrations: [sitemap(sitemapOptions(scanEntries(rootUrl, urlOf), site)), pagefind()],
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
