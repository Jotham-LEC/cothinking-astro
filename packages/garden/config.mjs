// @ts-check
// The Astro config every site shares; each site's astro.config.mjs calls
// `gardenConfig({ root, site, urlOf, otherSite })`.
import { defineConfig, fontProviders } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import pagefind from 'astro-pagefind';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { wikiRehypePlugins, wikiRemarkPlugins } from './lib/markdown/index.ts';
import { codeBlock } from './lib/markdown/shiki-code-block.ts';
import { lazyTitles, scanEntries } from './lib/scan.ts';
import { sitemapOptions } from './lib/sitemap.ts';

/**
 * One Aporetic face (SIL OFL, assets/fonts/LICENSE.md), self-hosted and subset to Latin.
 * @param {string} file
 * @param {number} weight
 * @param {'normal' | 'italic'} style
 * @returns {{ weight: number, style: 'normal' | 'italic', src: [URL] }}
 */
const font = (file, weight, style) => ({
  weight,
  style,
  src: [new URL(`./assets/fonts/${file}.woff2`, import.meta.url)],
});

/**
 * The routes every site has, from routes/: Astro adds each to the site's own src/pages.
 * @type {[pattern: string, file: string][]}
 */
const ROUTES = [
  ['/404', '404.astro'],
  ['/feed.xml', 'feed.xml.ts'],
  ['/graph.json', 'graph.json.ts'],
  ['/llms.txt', 'llms.txt.ts'],
  ['/og.png', 'og.png.ts'],
  ['/og/[...uri].png', 'og/[...uri].png.ts'],
  ['/robots.txt', 'robots.txt.ts'],
];

/** @type {import('astro').AstroIntegration} */
const sharedRoutes = {
  name: 'garden-routes',
  hooks: {
    'astro:config:setup': ({ injectRoute }) => {
      for (const [pattern, file] of ROUTES)
        injectRoute({ pattern, entrypoint: new URL(`./routes/${file}`, import.meta.url) });
    },
  },
};

/**
 * @param {object} options
 * @param {URL} options.root the site's folder (sites/<site>/)
 * @param {import('./lib/site.ts').SiteConfig} options.site the site's config (src/site.config.ts)
 * @param {import('./lib/entry.ts').UrlOf} options.urlOf the site's address rule (src/lib/urls.ts)
 * @param {{ root: URL, urlOf: import('./lib/entry.ts').UrlOf }} options.otherSite the other site's folder and address rule, for `[[wiki links]]` to its pages
 */
export function gardenConfig({ root: rootUrl, site, urlOf, otherSite }) {
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
        rehypePlugins: wikiRehypePlugins({ siteUrl: site.url }),
      }),
      // Shiki in both modes (styles/components.css picks the colour by light-dark()), each block in its chrome.
      syntaxHighlight: { type: 'shiki' },
      shikiConfig: {
        themes: { light: 'gruvbox-light-soft', dark: 'gruvbox-dark-soft' },
        defaultColor: false,
        transformers: [codeBlock()],
      },
    },
    integrations: [sharedRoutes, sitemap(sitemapOptions(scanEntries(rootUrl, urlOf), site)), pagefind()],
    vite: { plugins: [tailwindcss()] },
    // Sans for everything (400 and 700 with italics, 800 for headings), Sans Mono for code; layouts/Layout.astro loads them.
    fonts: [
      {
        provider: fontProviders.local(),
        name: 'Aporetic Sans',
        cssVariable: '--font-aporetic-sans',
        fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        options: {
          variants: [
            font('aporetic-sans-regular', 400, 'normal'),
            font('aporetic-sans-italic', 400, 'italic'),
            font('aporetic-sans-bold', 700, 'normal'),
            font('aporetic-sans-bold-italic', 700, 'italic'),
            font('aporetic-sans-extrabold', 800, 'normal'),
          ],
        },
      },
      {
        provider: fontProviders.local(),
        name: 'Aporetic Sans Mono',
        cssVariable: '--font-aporetic-mono',
        fallbacks: ['ui-monospace', 'monospace'],
        options: { variants: [font('aporetic-sans-mono-regular', 400, 'normal')] },
      },
    ],
    // Old addresses (site.config.ts `redirects`): Astro writes each as a meta-refresh page.
    redirects: site.redirects ?? {},
  });
}
