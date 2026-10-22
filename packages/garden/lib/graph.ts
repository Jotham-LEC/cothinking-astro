// The site as a graph: every published page is a node, every wiki link or
// Markdown link from one body to another page an edge. /graph.json and the
// rail's "Linked from" both read it, so they always agree.
import { byUrl, isChild, keyOf, type SiteEntry } from './entry.ts';
import { linkedPages } from './links.ts';
import { naturalCompare } from './natural.ts';
import type { SiteConfig } from './site.ts';
import type { TitleIndex } from './titles.ts';

export type GraphNode = { id: string; title: string; url: string; section: string; section_title: string };
export type Graph = { nodes: GraphNode[]; links: { source: string; target: string }[] };

export function buildGraph(live: SiteEntry[], site: SiteConfig, titles: TitleIndex): Graph {
  const urls = byUrl(live);
  const links: Graph['links'] = [];
  for (const page of live) {
    const seen = new Set<string>();
    for (const target of linkedPages(page.body, titles, urls)) {
      const id = keyOf(target);
      if (id === keyOf(page) || seen.has(id)) continue;
      seen.add(id);
      links.push({ source: keyOf(page), target: id });
    }
  }
  return {
    nodes: live.map((p) => ({
      id: keyOf(p),
      title: p.title,
      url: p.url,
      section: isChild(p, site) ? p.collection : '',
      section_title: isChild(p, site) ? (site.collections[p.collection]?.title ?? '') : '',
    })),
    links,
  };
}

/** The pages that link to one, by title. */
export function backlinks(graph: Graph, page: SiteEntry): GraphNode[] {
  const id = keyOf(page);
  const sources = new Set(graph.links.filter((l) => l.target === id).map((l) => l.source));
  return graph.nodes.filter((n) => sources.has(n.id)).sort((a, b) => naturalCompare(a.title, b.title));
}
