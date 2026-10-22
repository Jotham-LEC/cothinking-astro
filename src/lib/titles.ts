// The title index behind `[[wiki links]]`: a lower-cased title → the page's
// address (a path on this site, an absolute URL on the other). Titles are
// unique across both sites (`npm run check` enforces it).
import type { Page } from './types.ts';

export type TitleIndex = Record<string, string>;

export const normaliseTitle = (title: string): string => title.replace(/\\$/, '').trim().toLowerCase();

/** This site's published pages, over the other site's entries kept from the import. */
export function titleIndex(pages: Page[], other: TitleIndex = {}): TitleIndex {
  const index: TitleIndex = {};
  for (const [title, url] of Object.entries(other)) if (/^https?:\/\//.test(url)) index[title] = url;
  for (const page of pages) if (!page.draft && page.url) index[normaliseTitle(page.title)] = page.url;
  return index;
}

export function resolveTitle(index: TitleIndex, title: string): string | null {
  return index[normaliseTitle(title)] ?? null;
}
