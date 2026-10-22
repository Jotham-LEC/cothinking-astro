// The title index behind `[[wiki links]]`: a lower-cased title → the page's
// address (a path on this site, an absolute URL on cothink.ing). Worked out
// from the pages wherever it is needed (garden/config.mjs for the Markdown,
// load.ts for the graph), so a renamed page needs no extra step; the other
// site's titles come from src/data/other-site-titles.json (the import).
// Titles are unique across both sites (`npm run check:<site>` enforces it).
import type { Page } from './types.ts';

export type TitleIndex = Record<string, string>;

export const normaliseTitle = (title: string): string => title.replace(/\\$/, '').trim().toLowerCase();

/** This site's published pages, over the other site's titles. */
export function titleIndex(pages: Page[], other: TitleIndex = {}): TitleIndex {
  const index: TitleIndex = {};
  for (const [title, url] of Object.entries(other)) if (/^https?:\/\//.test(url)) index[title] = url;
  for (const page of pages) if (!page.draft && page.url) index[normaliseTitle(page.title)] = page.url;
  return index;
}

export function resolveTitle(index: TitleIndex, title: string): string | null {
  return index[normaliseTitle(title)] ?? null;
}
