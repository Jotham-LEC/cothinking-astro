// The notes either side of a note: every published note by date, older
// first. Any other page has neither.
import { byDateAsc, published } from './pages.ts';
import type { Page } from './types.ts';

export function pager(page: Page, pages: Page[]): { previous: Page | null; next: Page | null } {
  if (page.collection !== 'notes') return { previous: null, next: null };
  const ordered = byDateAsc(published(pages).filter((p) => p.collection === 'notes'));
  const index = ordered.findIndex((p) => p.slug === page.slug);
  if (index === -1) return { previous: null, next: null };
  return { previous: index > 0 ? ordered[index - 1]! : null, next: ordered[index + 1] ?? null };
}
