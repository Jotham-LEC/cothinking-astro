// The pages either side of one: a series (same collection, same `series`, by
// `part`), a post in a collection with `types`, such as a note (every post by
// date, older first), or a page of a collection the Explorer groups by
// category (its order: category by category, by `order`, then A–Z; past
// either end of a series there, the walk goes on). Published pages of the
// same collection only; any other page has neither.
import { sortOldestFirst, type SiteEntry } from './entry.ts';
import { groupByCategory } from './explorer.ts';
import type { SiteConfig } from './site.ts';

type Neighbours = { previous: SiteEntry | null; next: SiteEntry | null };

function around(ordered: SiteEntry[], page: SiteEntry | undefined): Neighbours {
  const index = page ? ordered.findIndex((p) => p.id === page.id) : -1;
  if (index === -1) return { previous: null, next: null };
  return { previous: index > 0 ? ordered[index - 1]! : null, next: ordered[index + 1] ?? null };
}

export function pager(page: SiteEntry, live: SiteEntry[], site: SiteConfig): Neighbours {
  const config = site.collections[page.collection];
  const own = live.filter((p) => p.collection === page.collection);
  const walk =
    config?.explorer === 'by-category'
      ? groupByCategory(own, config.categories ?? {}, (e) => e).flatMap((c) => c.entries)
      : null;
  if (page.series) {
    const parts = own.filter((p) => p.series === page.series).sort((a, b) => (a.part ?? 0) - (b.part ?? 0));
    const inSeries = around(parts, page);
    if (!walk) return inSeries;
    return {
      previous: inSeries.previous ?? around(walk, parts[0]).previous,
      next: inSeries.next ?? around(walk, parts.at(-1)).next,
    };
  }
  if (config?.types) return around(sortOldestFirst(own), page);
  if (walk) return around(walk, page);
  return { previous: null, next: null };
}
