// The title index behind `[[wiki links]]`: a lower-cased title → the page's
// address (a path on this site, a full address on the other). Titles are
// unique across both sites (check.ts enforces it).
import { absolute } from './site.ts';
import type { SiteEntry } from './entry.ts';

export type TitleIndex = Record<string, string>;

export const normaliseTitle = (title: string): string => title.replace(/\\$/, '').trim().toLowerCase();

/** This site's published pages, over the other site's. */
export function titleIndex(own: SiteEntry[], other: SiteEntry[] = [], otherUrl = ''): TitleIndex {
  const index: TitleIndex = {};
  for (const e of other) if (!e.draft) index[normaliseTitle(e.title)] = absolute(otherUrl, e.url);
  for (const e of own) if (!e.draft) index[normaliseTitle(e.title)] = e.url;
  return index;
}

export function resolveTitle(index: TitleIndex, title: string): string | null {
  return index[normaliseTitle(title)] ?? null;
}
