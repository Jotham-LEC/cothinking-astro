// What an entry's page says about the entry beyond its fields (App\Tags\Wiki::page):
// its section and that section's feed, whether it is a note or the home page,
// where it was first published, and the eyebrow (date and reading time, on a
// section's pages only).
import { day } from './dates.ts';
import { addressOf, isChild, mountedOn, pageByKey } from './pages.ts';
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
  original: Page | null;
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

/** The published piece a page reshares, unless it reshares back (then each stands alone). */
export function reshareOf(page: Page, pages: Page[]): Page | null {
  const key =
    typeof page.data.reshare === 'string'
      ? page.data.reshare
      : Array.isArray(page.data.reshare)
        ? String(page.data.reshare[0] ?? '')
        : '';
  if (!key) return null;
  const original = pageByKey(pages, key);
  if (!original || original.draft || original === page) return null;
  const back = typeof original.data.reshare === 'string' ? original.data.reshare : null;
  return back === `${page.collection}/${page.slug}` ? null : original;
}

export function pageInfo(page: Page, pages: Page[], collections: Collections, site: SiteConfig): PageInfo {
  const child = isChild(page, collections);
  const section = child ? page.collection : mountedOn(page, collections);
  const feed = section && site.feeds.includes(section) ? feedOf(section, site, collections) : null;
  const original = reshareOf(page, pages);
  const source = page.seo.canonical || (original ? addressOf(original, site.url) : null);
  const dated = (original ?? page).date;
  const dayText = dated ? day(dated) : null;
  const text = `${page.body} ${original?.body ?? ''}`.trim();
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
    original,
    // A section whose landing page's graph holds the whole section (`graph_section`).
    graphSection: !child && section && collections[section]?.graph_section ? section : null,
  };
}
