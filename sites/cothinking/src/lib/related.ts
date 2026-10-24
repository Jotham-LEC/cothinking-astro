// The entries a reference field names (`collection/id`: `related_pages`,
// `related_wiki`, `case_study`), as Astro entries, published only: the Related
// list, whether a view's outline has its heading, and a problem's case study.
import { getEntry, type CollectionEntry, type CollectionKey } from 'astro:content';
import { naturalCompare } from '@garden/lib/natural.ts';

type AnyEntry = CollectionEntry<CollectionKey>;

/** The published entry a reference names, or null. */
export async function resolveReference(key: string | undefined): Promise<AnyEntry | null> {
  if (!key) return null;
  const [collection, id] = key.split('/') as [CollectionKey, string];
  const entry = await getEntry(collection, id);
  return entry && !entry.data.draft ? entry : null;
}

/** The published entries the references name, A–Z by title. */
export async function relatedPages(keys: string[] | undefined): Promise<AnyEntry[]> {
  const entries = await Promise.all([...new Set(keys)].map(resolveReference));
  return entries.filter((e) => e !== null).sort((a, b) => naturalCompare(a.data.title, b.data.title));
}
