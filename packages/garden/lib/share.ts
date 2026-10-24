// What a page's generated share card says: the section it sits in (or the
// site's host for a root page) as the label, its title, its description, the
// site's name (the portrait is the card's own).
import { isSectionPage, type SiteEntry } from './entry.ts';
import type { CardInput } from './ogCard.ts';
import { description, ogTitle } from './seo.ts';
import type { SiteConfig } from './site.ts';

export function cardFor(page: SiteEntry, site: SiteConfig, live: SiteEntry[]): CardInput {
  const section = isSectionPage(page, site) ? (site.collections[page.collection]?.title ?? null) : null;
  const input = { page, path: page.url, site, live };
  return {
    label: section ?? new URL(site.url).host,
    title: ogTitle(input),
    description: description(input),
    url: site.name,
  };
}
