// The pages either side of one: a series (same collection, same `series`, by
// `part`), or a post in a collection with `types`, such as a note (every
// post by date, older first). Published pages of the same collection only;
// any other page has neither.
import { sortOldestFirst, type SiteEntry } from './entry.ts';
import type { SiteConfig } from './site.ts';

export function pager(
  page: SiteEntry,
  live: SiteEntry[],
  site: SiteConfig,
): { previous: SiteEntry | null; next: SiteEntry | null } {
  if (!page.series && !site.collections[page.collection]?.types) return { previous: null, next: null };
  const own = live.filter((p) => p.collection === page.collection);
  const ordered = page.series
    ? own.filter((p) => p.series === page.series).sort((a, b) => (a.part ?? 0) - (b.part ?? 0))
    : sortOldestFirst(own);
  const index = ordered.findIndex((p) => p.id === page.id);
  if (index === -1) return { previous: null, next: null };
  return { previous: index > 0 ? ordered[index - 1]! : null, next: ordered[index + 1] ?? null };
}
