// The problems I fix, published, in the tree's order (their `order`): the
// home page's list and the Problem statements page.
import { getCollection, type CollectionEntry } from 'astro:content';

export async function problemsInOrder(): Promise<CollectionEntry<'problems'>[]> {
  return (await getCollection('problems', (p) => !p.data.draft)).sort((a, b) => a.data.order - b.data.order);
}
