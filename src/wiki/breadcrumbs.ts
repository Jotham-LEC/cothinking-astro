// `~ / Section` breadcrumbs, as Statamic's nav:breadcrumbs finds them: the
// pages at each prefix of the address, home first, the page itself last.
import { byUrl } from './pages.ts';
import type { Page } from './types.ts';

export type Crumb = { title: string; url: string };

export function breadcrumbs(url: string, pages: Page[]): Crumb[] {
  const urls = byUrl(pages);
  const crumbs: Crumb[] = [];
  const home = urls.get('/');
  if (home) crumbs.push({ title: home.title, url: '/' });
  const segments = url.split('/').filter(Boolean);
  for (let i = 1; i <= segments.length; i++) {
    const prefix = '/' + segments.slice(0, i).join('/');
    const page = urls.get(prefix);
    if (page && !page.draft) crumbs.push({ title: page.title, url: prefix });
  }
  return crumbs;
}
