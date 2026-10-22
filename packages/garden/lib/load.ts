// The site at build time: its config and every content entry (validated by
// its content.config.ts) as SiteEntries, with the title index, the Explorer
// and the graph, each worked out once per build. `garden()` is the one
// thing a component awaits; the three `@site` imports (here and in
// layouts/Layout.astro) are the whole contract between a site and the garden.
import { getEntry, render, type CollectionKey } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { site } from '@site/site.config.ts';
import { loadEntries, otherEntries } from '@site/lib/entries.ts';
import { byUrl, keyOf, published, type SiteEntry } from './entry.ts';
import { explorerRows, type Row } from './explorer.ts';
import { buildGraph, type Graph } from './graph.ts';
import type { SiteConfig } from './site.ts';
import { titleIndex, type TitleIndex } from './titles.ts';

export type Garden = {
  site: SiteConfig;
  /** Every entry, drafts included. */
  entries: SiteEntry[];
  /** The entries a reader can see. */
  live: SiteEntry[];
  byUrl: Map<string, SiteEntry>;
  /** The SiteEntry behind one of Astro's entries (`collection` and `id`). */
  entry: (of: { collection: string; id: string }) => SiteEntry;
  titles: TitleIndex;
  explorer: Row[];
  graph: Graph;
  /** An entry's body as the page renders it (the feeds); rendered once per entry. */
  htmlOf: (entry: SiteEntry) => Promise<string>;
};

let cache: Promise<Garden> | null = null;

export function garden(): Promise<Garden> {
  cache ??= (async () => {
    const entries = await loadEntries();
    const live = published(entries);
    const byId = new Map(entries.map((e) => [keyOf(e), e]));
    const titles = titleIndex(live, otherEntries(), site.otherSite.url);
    const html = new Map<string, Promise<string>>();
    let container: Promise<AstroContainer> | null = null;
    return {
      site,
      entries,
      live,
      byUrl: byUrl(live),
      entry: (of) => {
        const found = byId.get(keyOf(of));
        if (!found) throw new Error(`No entry ${keyOf(of)}.`);
        return found;
      },
      titles,
      explorer: explorerRows(live, site),
      graph: buildGraph(live, site, titles),
      htmlOf: (entry) => {
        const key = keyOf(entry);
        if (!html.has(key))
          html.set(
            key,
            (async () => {
              const { Content } = await render((await getEntry(entry.collection as CollectionKey, entry.id))!);
              container ??= AstroContainer.create();
              return (await container).renderToString(Content);
            })(),
          );
        return html.get(key)!;
      },
    };
  })();
  return cache;
}
