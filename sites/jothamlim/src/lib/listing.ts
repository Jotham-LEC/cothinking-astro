// The dated collections' published entries in archive order: newest first,
// then A–Z by title (as the old site's `date:desc|title:asc`). The archives,
// the notes stream and the home page's "Latest" list through here.
import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '@site/site.config.ts';

type Dated = 'essays' | 'notes' | 'projects' | 'publications';
type DatedEntry = CollectionEntry<Dated>;

const newest = (a: DatedEntry, b: DatedEntry) =>
  b.data.date.getTime() - a.data.date.getTime() || a.data.title.localeCompare(b.data.title);

export async function newestFirst<C extends Dated>(collection: C): Promise<CollectionEntry<C>[]> {
  const entries: CollectionEntry<C>[] = await getCollection(collection, (e: DatedEntry) => !e.data.draft);
  return entries.sort(newest);
}

/** The newest `count` pages across every section (a collection with a landing page). */
export async function latest(count: number): Promise<DatedEntry[]> {
  const sections = Object.entries(site.collections).flatMap(([name, c]) => ('landing' in c ? [name as Dated] : []));
  return (await Promise.all(sections.map((c) => newestFirst(c)))).flat().sort(newest).slice(0, count);
}
