// The site at build time: the content and data collections (validated by
// src/content.config.ts) as Pages and settings, with the title index, the
// Explorer and the graph, each worked out once per build.
import { getCollection, getEntry, type CollectionEntry, type CollectionKey } from 'astro:content';
import titlesJson from '../data/titles.json';
import { explorerRows, type Row } from './explorer.ts';
import { buildGraph, type Graph } from './graph.ts';
import { published, toPages } from './pages.ts';
import type { TitleIndex } from './titles.ts';
import type { Author, Collections, NavItem, Page, RawEntry, SiteConfig } from './types.ts';

/** The data collections, as opposed to the content ones a Page comes from. */
const DATA_COLLECTIONS = ['site', 'collectionsConfig', 'navigation', 'redirects', 'authors'];

export type Wiki = {
  site: SiteConfig;
  collections: Collections;
  pages: Page[];
  /** Published pages with an address. */
  live: Page[];
  navigation: Record<string, NavItem[]>;
  redirects: { source: string; target: string }[];
  authors: Author[];
  titles: TitleIndex;
  explorer: Row[];
  graph: Graph;
  entryOf: (page: Page) => CollectionEntry<CollectionKey>;
};

let cache: Promise<Wiki> | null = null;

export function wiki(): Promise<Wiki> {
  cache ??= (async () => {
    const site = (await getEntry('site', 'site'))?.data as SiteConfig | undefined;
    if (!site) throw new Error('src/data/site.yaml is missing: run `npm run import`.');
    const collections = Object.fromEntries(
      (await getCollection('collectionsConfig')).map((c) => [c.id, c.data]),
    ) as Collections;
    const navigation = Object.fromEntries(
      (await getCollection('navigation')).map((n) => [n.id, n.data.items as NavItem[]]),
    );
    const redirects = (await getCollection('redirects')).map((r) => r.data);
    const authors = (await getCollection('authors')).map((a) => a.data);

    const raws: RawEntry[] = [];
    const entries = new Map<string, CollectionEntry<CollectionKey>>();
    for (const collection of Object.keys(collections).filter((c) => !DATA_COLLECTIONS.includes(c)) as CollectionKey[]) {
      for (const entry of await getCollection(collection)) {
        raws.push({ collection, slug: entry.id, data: entry.data as Record<string, unknown>, body: entry.body ?? '' });
        entries.set(`${collection}/${entry.id}`, entry);
      }
    }
    const pages = toPages(raws, collections);
    const titles = titlesJson as TitleIndex;
    const partial = { site, collections, pages, navigation };
    return {
      ...partial,
      live: published(pages),
      redirects,
      authors,
      titles,
      explorer: explorerRows(partial),
      graph: buildGraph(pages, collections, titles),
      entryOf: (page) => {
        const entry = entries.get(`${page.collection}/${page.slug}`);
        if (!entry) throw new Error(`No entry for ${page.collection}/${page.slug}`);
        return entry;
      },
    };
  })();
  return cache;
}
