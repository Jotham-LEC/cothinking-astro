// What a page's generated share card says: the section it sits in (or the
// site's host for a root page) as the label, its title, its description, the
// site's name (the portrait is the card's own).
import { isChild, type SiteEntry } from './entry.ts';
import type { Garden } from './load.ts';
import type { CardInput } from './ogCard.ts';
import { description, ogTitle } from './seo.ts';

export function cardFor(page: SiteEntry, g: Garden): CardInput {
  const { site } = g;
  const section = isChild(page, site) ? (site.collections[page.collection]?.title ?? null) : null;
  const input = { page, path: page.url, site, live: g.live };
  return {
    label: section ?? new URL(site.url).host,
    title: ogTitle(input),
    description: description(input),
    url: site.name,
  };
}
