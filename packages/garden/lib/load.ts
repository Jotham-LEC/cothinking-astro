// The site at build time: the content and data collections (validated by
// src/content.config.ts) as Pages and settings, with the title index, the
// Explorer and the graph, each worked out once per build.
import { getCollection, getEntry, type CollectionEntry, type CollectionKey } from 'astro:content';
import otherSiteTitles from '@site/data/other-site-titles.json';
import { explorerRows, type Row } from './explorer.ts';
import { buildGraph, type Graph } from './graph.ts';
import { renderFeed } from './markdown/feed.ts';
import { published, toPages } from './pages.ts';
import { titleIndex, type TitleIndex } from './titles.ts';
import type { Author, Collections, LivePage, NavItem, Page, RawEntry, SiteConfig } from './types.ts';

// The authors collection is defined only on a site whose src/data/authors.yaml has entries
// (garden/content.ts), so it is read only there: an empty one warns on every build.
const hasAuthors = Object.keys(import.meta.glob('/src/data/authors.yaml')).length > 0;

export type Wiki = {
  site: SiteConfig;
  collections: Collections;
  pages: Page[];
  /** Published pages with an address. */
  live: LivePage[];
  navigation: Record<string, NavItem[]>;
  authors: Author[];
  titles: TitleIndex;
  explorer: Row[];
  graph: Graph;
  /** A page's body as plain HTML (the feed parser, callouts rendered), for descriptions; rendered once per page. */
  htmlOf: (page: Page) => Promise<string>;
  entryOf: (page: Page) => CollectionEntry<CollectionKey>;
};

let cache: Promise<Wiki> | null = null;

export function wiki(): Promise<Wiki> {
  cache ??= (async () => {
    const site = (await getEntry('site', 'site'))?.data as SiteConfig | undefined;
    if (!site) throw new Error('src/data/site.yaml is missing: run `npm run import:<site>`.');
    const collections = Object.fromEntries(
      (await getCollection('collectionsConfig')).map((c) => [c.id, c.data]),
    ) as Collections;
    const navigation = Object.fromEntries(
      (await getCollection('navigation')).map((n) => [n.id, n.data.items as NavItem[]]),
    );
    const authors = hasAuthors
      ? (await getCollection('authors' as CollectionKey)).map((a) => a.data as unknown as Author)
      : [];

    const raws: RawEntry[] = [];
    const entries = new Map<string, CollectionEntry<CollectionKey>>();
    for (const collection of Object.keys(collections) as CollectionKey[]) {
      for (const entry of await getCollection(collection)) {
        raws.push({ collection, slug: entry.id, data: entry.data as Record<string, unknown>, body: entry.body ?? '' });
        entries.set(`${collection}/${entry.id}`, entry);
      }
    }
    const pages = toPages(raws, collections);
    const titles = titleIndex(published(pages), otherSiteTitles as TitleIndex);
    const partial = { site, collections, pages, navigation };
    const html = new Map<string, Promise<string>>();
    return {
      ...partial,
      live: published(pages),
      authors,
      titles,
      explorer: explorerRows(partial),
      graph: buildGraph(pages, collections, titles),
      htmlOf: (page) => {
        const key = `${page.collection}/${page.slug}`;
        if (!html.has(key)) html.set(key, renderFeed(page.body, titles, { callouts: true }));
        return html.get(key)!;
      },
      entryOf: (page) => {
        const entry = entries.get(`${page.collection}/${page.slug}`);
        if (!entry) throw new Error(`No entry for ${page.collection}/${page.slug}`);
        return entry;
      },
    };
  })();
  return cache;
}
