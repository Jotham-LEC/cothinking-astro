// @ts-check
// The Astro config every site shares; each site's astro.config.mjs calls
// `gardenConfig({ root, site, otherSite })`.
import { fileURLToPath } from 'node:url';
import { defineConfig, fontProviders } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import pagefind from 'astro-pagefind';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { wikiRehypePlugins, wikiRemarkPlugins } from './lib/markdown/index.ts';
import { codeBlock } from './lib/markdown/shiki-code-block.ts';
import { scanEntries, siteIndex } from './lib/scan.ts';
import { sitemapOptions } from './lib/sitemap.ts';

/**
 * One self-hosted face (SIL OFL, assets/fonts/LICENSE.md): Aporetic subset to Latin, Source Serif 4 whole.
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
  ['/[...uri].md', '[...uri].md.ts'],
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

const LINK_INDEX = 'virtual:garden/link-index';

/**
 * `virtual:garden/link-index`: the link index the Markdown pipeline resolves against, for the routes (the Markdown
 * copies), which cannot import this config: the same `siteIndex` on the same files. virtual.d.ts types it.
 * @param {URL} rootUrl
 * @param {import('./lib/site.ts').SiteConfig} site
 * @returns {import('vite').Plugin}
 */
const linkIndexModule = (rootUrl, site) => ({
  name: 'garden-link-index',
  resolveId: (id) => (id === LINK_INDEX ? `\0${LINK_INDEX}` : undefined),
  load(id) {
    if (id !== `\0${LINK_INDEX}`) return;
    const file = (/** @type {string} */ path, /** @type {URL} */ base) =>
      JSON.stringify(fileURLToPath(new URL(path, base)));
    return [
      `import { siteIndex } from ${file('./lib/scan.ts', new URL(import.meta.url))};`,
      `import { site } from ${file('src/site.config.ts', rootUrl)};`,
      `import { site as otherSite } from ${file(`../${site.otherSite.folder}/src/site.config.ts`, rootUrl)};`,
      `export const linkIndex = siteIndex(new URL(${JSON.stringify(rootUrl.href)}), site, otherSite);`,
    ].join('\n');
  },
});

/**
 * @param {object} options
 * @param {URL} options.root the site's folder (sites/<site>/)
 * @param {import('./lib/site.ts').SiteConfig} options.site the site's config (src/site.config.ts)
 * @param {import('./lib/site.ts').SiteConfig} options.otherSite the other site's config (sites/<site.otherSite.folder>), for links to its pages
 */
export function gardenConfig({ root: rootUrl, site, otherSite }) {
  // The link index (`[[Title]]` and `[text](../essays/x.md)`), from both sites' content on disk: read once in a
  // build, on every render in dev.
  const index = siteIndex(rootUrl, site, otherSite);

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
        remarkPlugins: wikiRemarkPlugins({ index, siteUrl: site.url, root: fileURLToPath(rootUrl) }),
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
    integrations: [sharedRoutes, sitemap(sitemapOptions(scanEntries(rootUrl, site), site)), pagefind()],
    vite: { plugins: [tailwindcss(), linkIndexModule(rootUrl, site)] },
    // Aporetic Sans for the shell and headings (400 and 700 with italics, 800 for headings), Source Serif 4 for
    // rendered prose (400 and 700 with italics), Aporetic Sans Mono for code; layouts/Layout.astro loads them.
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
        name: 'Source Serif 4',
        cssVariable: '--font-source-serif',
        fallbacks: ['ui-serif', 'Charter', 'Cambria', 'Georgia', 'Noto Serif', 'serif'],
        options: {
          variants: [
            font('source-serif-4-regular', 400, 'normal'),
            font('source-serif-4-italic', 400, 'italic'),
            font('source-serif-4-bold', 700, 'normal'),
            font('source-serif-4-bold-italic', 700, 'italic'),
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
