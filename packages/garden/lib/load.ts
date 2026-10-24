// The site at build time: its config and its published content entries
// (every collection site.config.ts lists, validated by its
// content.config.ts) as SiteEntries, with the Explorer and the graph, each
// worked out once per build. `garden()` is the one thing a component awaits;
// the two `@site` imports (here and in layouts/Layout.astro) are the whole
// contract between a site and the garden.
import { getCollection, getEntry, render, type CollectionKey } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
// `@site/*` is the site being built: each site's tsconfig.json maps it to its own src/ (AGENTS.md, "Aliases").
import { site as config } from '@site/site.config.ts';
import { descriptionOf, keyOf, published, toSiteEntry, urlFor, type SiteEntry } from './entry.ts';
import { explorerRows, type Row } from './explorer.ts';
import { buildGraph, type Graph } from './graph.ts';
import type { SiteConfig } from './site.ts';
import { linkIndex } from './titles.ts';

/** The site being built, as the garden sees any site (its own views import site.config.ts for its literal types). */
export const site: SiteConfig = config;

/** Where one of Astro's entries lives on this site (`urlFor` with the site's config). */
export const urlOf = (entry: { collection: string; id: string }): string => urlFor(site)(entry.collection, entry.id);

/**
 * What one of Astro's entries is about: `descriptionOf` its SiteEntry (its own description, else its opening
 * paragraphs, which only the Markdown pipeline knows). The bridge for a site's view, which never holds a SiteEntry.
 */
export const describe = async (entry: { collection: string; id: string }): Promise<string | null> =>
  descriptionOf((await garden()).entry(entry));

export type Garden = {
  /** The entries a reader can see. */
  live: SiteEntry[];
  /** The SiteEntry behind one of Astro's entries (`collection` and `id`). */
  entry: (of: { collection: string; id: string }) => SiteEntry;
  explorer: Row[];
  graph: Graph;
  /** An entry's body as the page renders it (the feeds); rendered once per entry. */
  htmlOf: (entry: SiteEntry) => Promise<string>;
};

let cache: Promise<Garden> | null = null;

export function garden(): Promise<Garden> {
  cache ??= (async () => {
    // A–Z by name, so the graph's order does not follow the config's.
    const names = Object.keys(site.collections).sort();
    const collections = await Promise.all(names.map((c) => getCollection(c as CollectionKey)));
    const entries = collections.flat().map((e) => toSiteEntry(e, site));
    const live = published(entries);
    const byId = new Map(entries.map((e) => [keyOf(e), e]));
    // The graph's links are this site's pages only, so its own index is enough (a link to the other site is no node).
    const index = linkIndex(live);
    const html = new Map<string, Promise<string>>();
    let container: Promise<AstroContainer> | null = null;
    return {
      live,
      entry: (of) => {
        const found = byId.get(keyOf(of));
        if (!found) throw new Error(`No entry ${keyOf(of)}.`);
        return found;
      },
      explorer: explorerRows(live, site),
      graph: buildGraph(live, site, index),
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
