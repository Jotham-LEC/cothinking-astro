// Addresses, as Statamic resolves a collection's `route`: `{mount}` is the
// landing page's address, `{parent_uri}` the parent's in a structured
// collection, `{slug}` the entry's. The first item of a root tree is `/`. An
// entry of a structured collection that is not in its tree has no address.
import type { Collections } from './types.ts';

export type Locatable = { collection: string; slug: string; order: number | null; parent: string | null };

export function resolveUrls<T extends Locatable>(items: T[], collections: Collections): Map<T, string | null> {
  const byKey = new Map(items.map((item) => [`${item.collection}/${item.slug}`, item]));
  const urls = new Map<T, string | null>();

  const urlOf = (item: T, seen: Set<T>): string | null => {
    if (urls.has(item)) return urls.get(item)!;
    if (seen.has(item)) return null;
    seen.add(item);
    const c = collections[item.collection];
    if (!c) throw new Error(`Unknown collection ${item.collection}`);
    let url: string | null;
    if ((c.root || c.orderable) && item.order === null) {
      url = null;
    } else if (c.root && item.order === 0) {
      url = '/';
    } else {
      let route = c.route;
      if (route.includes('{mount}')) {
        const mount = c.mount ? byKey.get(`${c.mount.collection}/${c.mount.slug}`) : undefined;
        route = route.replace('{mount}', (mount && urlOf(mount, seen)) ?? '');
      }
      if (route.includes('{parent_uri}')) {
        const parent = item.parent ? byKey.get(`${item.collection}/${item.parent}`) : undefined;
        route = route.replace('{parent_uri}', (parent && urlOf(parent, seen)) ?? '');
      }
      route = route.replace('{slug}', item.slug);
      url = ('/' + route).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    }
    urls.set(item, url);
    return url;
  };

  for (const item of items) urlOf(item, new Set());
  return urls;
}

/** Whether an address leaves the site: http(s) on another host (CommonMark's ExternalLinkExtension). */
export function isExternal(href: string, siteUrl: string): boolean {
  try {
    const url = new URL(href);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.host !== new URL(siteUrl).host;
  } catch {
    return false;
  }
}

/** An address's path, so a relative and an absolute address to one page match. */
export function pathOf(url: string): string {
  const path = url.startsWith('http') ? new URL(url).pathname : url.split(/[?#]/)[0]!;
  return path.replace(/\/$/, '') || '/';
}

/** The absolute address of a path on a site; the home page is the bare site URL, as Statamic prints it. */
export function absolute(siteUrl: string, path: string): string {
  return siteUrl.replace(/\/$/, '') + (path === '/' ? '' : path);
}
