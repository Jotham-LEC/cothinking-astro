// The pages either side of one: a series (same collection, same `series`, by
// `part`), or a note (every note by date, older first). Published pages of
// the same collection only; any other page has neither.
import { byDateAsc, published } from './pages.ts';
import type { Page } from './types.ts';

export function pager(page: Page, pages: Page[]): { previous: Page | null; next: Page | null } {
  const series = typeof page.data.series === 'string' && page.data.series !== '' ? page.data.series : null;
  if (!series && page.collection !== 'notes') return { previous: null, next: null };
  const own = published(pages).filter((p) => p.collection === page.collection);
  const ordered = series
    ? own.filter((p) => p.data.series === series).sort((a, b) => Number(a.data.part ?? 0) - Number(b.data.part ?? 0))
    : byDateAsc(own);
  const index = ordered.findIndex((p) => p.slug === page.slug);
  if (index === -1) return { previous: null, next: null };
  return { previous: index > 0 ? ordered[index - 1]! : null, next: ordered[index + 1] ?? null };
}
