// @astrojs/sitemap's options: only the pages `inSitemap` lists (published,
// indexable, their own canonical address), each with its `updated` as
// lastmod. The integration writes /sitemap-index.xml and /sitemap-0.xml,
// which robots.txt names.
import type { SitemapOptions } from '@astrojs/sitemap';
import type { SiteEntry } from './entry.ts';
import { inSitemap } from './seo.ts';
import { absolute, type SiteConfig } from './site.ts';

export function sitemapOptions(entries: SiteEntry[], site: SiteConfig): SitemapOptions {
  const key = (url: string) => url.replace(/\/$/, '');
  const listed = new Map(
    entries
      .filter((p) => inSitemap(p, site))
      .map((p) => [key(absolute(site.url, p.url)), p.updated?.toISOString() ?? null]),
  );
  return {
    filter: (url) => listed.has(key(url)),
    serialize: (item) => {
      const lastmod = listed.get(key(item.url));
      return lastmod ? { ...item, lastmod } : item;
    },
  };
}
