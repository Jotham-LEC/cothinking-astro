// `~ / Section` breadcrumbs: the pages at each prefix of the address, home
// first, the page itself last (the JSON-LD trail), and the crumbs drawn
// above the title (`parents`).
import { indexByUrl, type SiteEntry } from './entry.ts';

type Crumb = { title: string; url: string };

export function breadcrumbs(url: string, live: SiteEntry[]): Crumb[] {
  const urls = indexByUrl(live);
  const crumbs: Crumb[] = [];
  const home = urls.get('/');
  if (home) crumbs.push({ title: home.title, url: '/' });
  const segments = url.split('/').filter(Boolean);
  for (let i = 1; i <= segments.length; i++) {
    const prefix = '/' + segments.slice(0, i).join('/');
    const page = urls.get(prefix);
    if (page) crumbs.push({ title: page.title, url: prefix });
  }
  return crumbs;
}

/** The crumbs a page draws: the trail without the page itself. A page with no entry at its address (/notes/2, a type listing) keeps its last crumb, its parent. */
export function parents(url: string, live: SiteEntry[]): Crumb[] {
  const crumbs = breadcrumbs(url, live);
  return crumbs.at(-1)?.url === url ? crumbs.slice(0, -1) : crumbs;
}
