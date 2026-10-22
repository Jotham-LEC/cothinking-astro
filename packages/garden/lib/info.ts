// What an entry's page says about the entry beyond its fields: its section
// and that section's feed, whether it is a post (a collection with `types`,
// such as notes) or the home page, where it
// was first published (`seo.canonical`), and the eyebrow (date and reading
// time, on a section's pages only).
import { day } from './dates.ts';
import { isChild, mountedOn, type SiteEntry } from './entry.ts';
import { readTime } from './readTime.ts';
import type { SiteConfig } from './site.ts';

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

/** A feed's title and address: the site's, or one section's. */
export function feedOf(section: string | null, site: SiteConfig): { title: string; url: string } {
  return {
    title: section ? `${site.name} — ${site.collections[section]?.title ?? section}` : site.name,
    url: section ? `/${section}/feed.xml` : '/feed.xml',
  };
}

export function pageInfo(entry: SiteEntry, site: SiteConfig): PageInfo {
  const child = isChild(entry, site);
  const section = child ? entry.collection : mountedOn(entry, site);
  const feed = section && site.collections[section]?.feed ? feedOf(section, site) : null;
  const source = entry.seo.canonical ?? null;
  const dayText = entry.date ? day(entry.date) : null;
  const text = entry.body.trim();
  const minutes = text !== '' ? readTime(text) : null;
  return {
    section,
    feedTitle: feed?.title ?? null,
    feedUrl: feed?.url ?? null,
    isNote: site.collections[entry.collection]?.types !== undefined,
    isHome: entry.url === '/',
    source,
    sourceDate: source && dayText ? `, ${dayText}` : '',
    readTime: minutes,
    eyebrow: child && dayText ? `${dayText}${minutes ? ` · ${minutes} min read` : ''}` : null,
    // A section whose landing page's graph holds the whole section (`graphSection`).
    graphSection: !child && section && site.collections[section]?.graphSection ? section : null,
  };
}
