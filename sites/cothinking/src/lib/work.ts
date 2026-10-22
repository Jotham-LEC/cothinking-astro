// The work collection in the tree's order, published, with its typed
// fields (a testimonial's photo, the website, the numbers).
import { getCollection, type CollectionEntry } from 'astro:content';

export async function workEntries(): Promise<CollectionEntry<'work'>[]> {
  return (await getCollection('work', (w) => !w.data.draft)).sort((a, b) => a.data.order - b.data.order);
}

/** The first work entry with a testimonial, as a pull quote. */
export const testimonialOf = (work: CollectionEntry<'work'>[]) =>
  work.find((c) => typeof c.data.quote === 'string' && c.data.quote !== '') ?? null;
