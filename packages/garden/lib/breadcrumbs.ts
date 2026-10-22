// `~ / Section` breadcrumbs: the pages at each prefix of the address, home
// first, the page itself last.
import { byUrl, type SiteEntry } from './entry.ts';

type Crumb = { title: string; url: string };

export function breadcrumbs(url: string, live: SiteEntry[]): Crumb[] {
  const urls = byUrl(live);
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
