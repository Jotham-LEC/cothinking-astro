// @astrojs/sitemap's options: only the pages `inSitemap` lists (published,
// indexable, their own canonical address), each with its `updated` as
// lastmod, and every page of a remote collection (`<path>/<id>`, not a
// stream's later page), which the files on disk cannot list. The integration writes /sitemap-index.xml and /sitemap-0.xml,
// which robots.txt names.
import type { SitemapOptions } from '@astrojs/sitemap';
import { makeUrlOf, type SiteEntry } from './entry.ts';
import { inSitemap } from './seo.ts';
import { absolute, type SiteConfig } from './site.ts';

export function sitemapOptions(entries: SiteEntry[], site: SiteConfig): SitemapOptions {
  const key = (url: string) => url.replace(/\/$/, '');
  const listed = new Map(
    entries
      .filter((p) => inSitemap(p, site))
      .map((p) => [key(absolute(site.url, p.url)), p.updated?.toISOString() ?? null]),
  );
  const remote = Object.entries(site.collections)
    .filter(([, c]) => c.remote)
    .map(([collection]) => key(absolute(site.url, makeUrlOf(site)(collection, 'x'))).slice(0, -1));
  const isRemote = (url: string) =>
    remote.some((base) => {
      const id = url.slice(base.length);
      return url.startsWith(base) && /^[a-z0-9-]+$/.test(id) && !/^\d+$/.test(id);
    });
  return {
    filter: (url) => listed.has(key(url)) || isRemote(key(url)),
    serialize: (item) => {
      const lastmod = listed.get(key(item.url));
      return lastmod ? { ...item, lastmod } : item;
    },
  };
}
