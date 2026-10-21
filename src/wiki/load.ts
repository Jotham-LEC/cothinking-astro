// The site at build time: Astro's collections (validated by content.config.ts)
// as Pages, with the data files, the title index, the Explorer and the graph,
// each worked out once per build.
import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import collectionsYaml from '../data/collections.yaml';
import siteYaml from '../data/site.yaml';
import redirectsYaml from '../data/redirects.yaml';
import titlesJson from '../data/titles.json';
import { explorerRows, type Row } from './explorer.ts';
import { buildGraph, type Graph } from './graph.ts';
import { published, toPages } from './pages.ts';
import type { TitleIndex } from './titles.ts';
import type { Collections, NavItem, Page, RawEntry, SiteConfig } from './types.ts';

export type Wiki = {
  site: SiteConfig;
  collections: Collections;
  pages: Page[];
  /** Published pages with an address. */
  live: Page[];
  navigation: Record<string, NavItem[]>;
  redirects: { source: string; target: string }[];
  titles: TitleIndex;
  explorer: Row[];
  graph: Graph;
  entryOf: (page: Page) => CollectionEntry<CollectionKey>;
};

const navigationFiles = import.meta.glob<NavItem[]>('../data/navigation/*.yaml', { eager: true, import: 'default' });

let cache: Promise<Wiki> | null = null;

export function wiki(): Promise<Wiki> {
  cache ??= (async () => {
    const site = siteYaml as SiteConfig;
    const collections = collectionsYaml as Collections;
    const navigation: Record<string, NavItem[]> = {};
    for (const [file, items] of Object.entries(navigationFiles))
      navigation[file.replace(/^.*\/([^/]+)\.yaml$/, '$1')] = items;

    const raws: RawEntry[] = [];
    const entries = new Map<string, CollectionEntry<CollectionKey>>();
    for (const collection of Object.keys(collections) as CollectionKey[]) {
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
      redirects: redirectsYaml as Wiki['redirects'],
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
