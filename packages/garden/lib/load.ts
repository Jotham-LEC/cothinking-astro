// The site at build time: every collection site.config.ts lists, as SiteEntries, with the Explorer and the graph,
// worked out once per build (`garden()`). Also the bridge from Astro's entries to them: `AstroEntry`, `urlOf`,
// `describeEntry`, `siteEntryOf`. DEV_FILES/wiki/01-content-and-sites.md, "Two shapes of one page".
import { getCollection, getEntry, render, type CollectionEntry, type CollectionKey } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
// `@site/*` is the site being built: each site's tsconfig.json maps it to its own src/ (AGENTS.md, "Aliases").
import { site as siteConfig } from '@site/site.config.ts';
import { descriptionOf, keyOf, published, toSiteEntry, makeUrlOf, type SiteEntry } from './entry.ts';
import { explorerRows, type Row } from './explorer.ts';
import { buildGraph, type Graph } from './graph.ts';
import type { SiteConfig } from './site.ts';
import { linkIndex } from './linkIndex.ts';

/** The site being built, as the garden sees any site (its own views import site.config.ts for its literal types). */
export const site: SiteConfig = siteConfig;

/** An entry as Astro's `getCollection`/`getEntry` return it, from any collection of the site being built. */
export type AstroEntry = CollectionEntry<CollectionKey>;

/** Where one of Astro's entries lives on this site (`makeUrlOf` with the site's config). */
export const urlOf = (entry: AstroEntry): string => makeUrlOf(site)(entry.collection, entry.id);

/**
 * What one of Astro's entries is about: `descriptionOf` its SiteEntry (its own description, else its opening
 * paragraphs, which only the Markdown pipeline knows). For a site's view, which never holds a SiteEntry.
 */
export const describeEntry = async (entry: AstroEntry): Promise<string | null> =>
  descriptionOf((await garden()).siteEntryOf(entry));

export type Garden = {
  /** The entries a reader can see. */
  live: SiteEntry[];
  /** The SiteEntry behind one of Astro's entries. */
  siteEntryOf: (entry: AstroEntry) => SiteEntry;
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
      siteEntryOf: (entry) => {
        const found = byId.get(keyOf(entry));
        if (!found) throw new Error(`No entry ${keyOf(entry)}.`);
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
