// The publications archive: the pieces of the collection mounted on a page,
// newest first, grouped by year in the display timezone, each with its
// outlet's label.
import { year } from './dates.ts';
import { childrenOf, mountedOn, optionLabel } from './pages.ts';
import type { Collections, Page } from './types.ts';

/** Pieces grouped by the year of their date (display timezone), in the order given (newest first). */
export function byYear(pieces: Page[]): [string, Page[]][] {
  const groups = new Map<string, Page[]>();
  for (const p of pieces) {
    const y = p.date ? year(p.date) : '';
    groups.set(y, [...(groups.get(y) ?? []), p]);
  }
  return [...groups.entries()];
}

type Piece = { date: Date | null; url: string; title: string; outlet: string | null };

export function years(page: Page, pages: Page[], collections: Collections): { year: string; pieces: Piece[] }[] {
  const section = mountedOn(page, collections);
  if (!section) return [];
  return byYear(childrenOf(section, pages, collections)).map(([year, pieces]) => ({
    year,
    pieces: pieces.map((p) => ({
      date: p.date,
      url: p.url!,
      title: p.title,
      outlet: optionLabel(collections, section, 'outlet', p.data.outlet),
    })),
  }));
}
