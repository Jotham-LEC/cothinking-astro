// @astrojs/sitemap's options: only the pages that are their own canonical
// address and ask to be indexed (not noindex, not `seo.sitemap: false`, not
// a reshare, not a canonical elsewhere), each with its `updated` as lastmod.
// The integration writes /sitemap-index.xml and /sitemap-0.xml, which
// robots.txt names.
import type { SitemapOptions } from '@astrojs/sitemap';
import { loadProject } from './files.ts';
import { sitemapEntries } from './textFiles.ts';

export function sitemapOptions(root: string): SitemapOptions {
  const { site, pages } = loadProject(root);
  const listed = new Map(sitemapEntries(pages, site).map((e) => [e.loc.replace(/\/$/, ''), e.lastmod]));
  const key = (url: string) => url.replace(/\/$/, '');
  return {
    filter: (url) => listed.has(key(url)),
    serialize: (item) => {
      const lastmod = listed.get(key(item.url));
      return lastmod ? { ...item, lastmod } : item;
    },
  };
}
