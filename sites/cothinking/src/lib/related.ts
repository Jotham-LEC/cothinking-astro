// The pages a `related_pages` or `related_wiki` field names (`collection/slug`),
// published, A–Z: the Related list, and whether a view's outline has its heading.
import { naturalCompare } from '@garden/lib/natural.ts';
import type { LivePage } from '@garden/lib/types.ts';

const LINKABLE = ['cothinking_pages', 'problems', 'wiki'];

export function relatedPages(keys: unknown, live: LivePage[]): LivePage[] {
  const wanted = new Set(Array.isArray(keys) ? keys : []);
  return live
    .filter((p) => LINKABLE.includes(p.collection) && wanted.has(`${p.collection}/${p.slug}`))
    .sort((a, b) => naturalCompare(a.title, b.title));
}
