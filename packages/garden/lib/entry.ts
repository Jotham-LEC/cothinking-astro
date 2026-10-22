// What an entry's page says about the entry beyond its fields (App\Tags\Wiki::page):
// its section and that section's feed, whether it is a note or the home page,
// where it was first published (`seo.canonical`), and the eyebrow (date and
// reading time, on a section's pages only).
import { day } from './dates.ts';
import { isChild, mountedOn } from './pages.ts';
import { readTime } from './readTime.ts';
import type { Collections, Page, SiteConfig } from './types.ts';

export type PageInfo = {
  section: string | null;
  feedTitle: string | null;
  feedUrl: string | null;
  isNote: boolean;
  isHome: boolean;
  source: string | null;
  sourceDate: string;
  readTime: number | null;
  eyebrow: string | null;
  graphSection: string | null;
};

export function feedOf(
  section: string | null,
  site: SiteConfig,
  collections: Collections,
): { title: string; url: string } {
  return {
    title: section ? `${site.name} — ${collections[section]?.title ?? section}` : site.name,
    url: section ? `/${section}/feed.xml` : '/feed.xml',
  };
}

export function pageInfo(page: Page, collections: Collections, site: SiteConfig): PageInfo {
  const child = isChild(page, collections);
  const section = child ? page.collection : mountedOn(page, collections);
  const feed = section && site.feeds.includes(section) ? feedOf(section, site, collections) : null;
  const source = page.seo.canonical ?? null;
  const dayText = page.date ? day(page.date) : null;
  const text = page.body.trim();
  const minutes = text !== '' ? readTime(text) : null;
  return {
    section,
    feedTitle: feed?.title ?? null,
    feedUrl: feed?.url ?? null,
    isNote: page.collection === 'notes',
    isHome: page.url === '/',
    source,
    sourceDate: source && dayText ? `, ${dayText}` : '',
    readTime: minutes,
    eyebrow: child && dayText ? `${dayText}${minutes ? ` · ${minutes} min read` : ''}` : null,
    // A section whose landing page's graph holds the whole section (`graph_section`).
    graphSection: !child && section && collections[section]?.graph_section ? section : null,
  };
}
