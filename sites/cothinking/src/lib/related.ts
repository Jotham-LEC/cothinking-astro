// The pages a `related_pages` or `related_wiki` field names (`collection/id`),
// published, A–Z: the Related list, and whether a view's outline has its heading.
import { keyOf, type SiteEntry } from '@garden/lib/entry.ts';
import { naturalCompare } from '@garden/lib/natural.ts';

export function relatedPages(keys: string[] | undefined, live: SiteEntry[]): SiteEntry[] {
  const wanted = new Set(keys ?? []);
  return live.filter((p) => wanted.has(keyOf(p))).sort((a, b) => naturalCompare(a.title, b.title));
}
