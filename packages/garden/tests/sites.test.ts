// Every site in sites/*: its config and content, scanned off the disk, pass
// the content check (garden/lib/check.ts) and hold together: a home page, a
// landing page per section, the Explorer's folders, a graph with a node per
// page, a title for every [[wiki link]] either site makes to the other.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { check } from '../lib/check.ts';
import { byUrl, published, toSiteEntry, type UrlOf } from '../lib/entry.ts';
import { explorerRows } from '../lib/explorer.ts';
import { buildGraph } from '../lib/graph.ts';
import { scanRaw } from '../lib/scan.ts';
import type { SiteConfig } from '../lib/site.ts';
import { titleIndex } from '../lib/titles.ts';

const sitesDir = path.resolve(__dirname, '../../../sites');
const names = fs.readdirSync(sitesDir).filter((n) => fs.existsSync(path.join(sitesDir, n, 'src/site.config.ts')));

type Loaded = { name: string; root: string; site: SiteConfig; urlOf: UrlOf };
const loaded: Loaded[] = await Promise.all(
  names.map(async (name) => {
    const root = path.join(sitesDir, name);
    const { site } = (await import(pathToFileURL(path.join(root, 'src/site.config.ts')).href)) as { site: SiteConfig };
    const { urlOf } = (await import(pathToFileURL(path.join(root, 'src/lib/urls.ts')).href)) as { urlOf: UrlOf };
    return { name, root, site, urlOf };
  }),
);
const otherOf = (s: Loaded) => loaded.find((o) => o.site.url === s.site.otherSite.url) ?? null;

describe.each(loaded)('$name', (s) => {
  const raws = scanRaw(s.root);
  const entries = raws.map((r) => toSiteEntry(r, s.urlOf));
  const live = published(entries);
  const other = otherOf(s);
  const otherEntries = other ? published(scanRaw(other.root).map((r) => toSiteEntry(r, other.urlOf))) : [];

  it('names its other site, which is in sites/ too', () => {
    expect(other).not.toBeNull();
  });
  it('passes the content check', () => {
    expect(check({ root: s.root, site: s.site, urlOf: s.urlOf, raws, other: { entries: otherEntries, url: s.site.otherSite.url } })).toEqual([]);
  });
  it('has a home page and a landing page for every section', () => {
    const urls = byUrl(live);
    expect(urls.get('/')?.collection).toBe('pages');
    for (const [collection, c] of Object.entries(s.site.collections))
      if (c.landing) expect(urls.get(s.urlOf('pages', c.landing))?.id, collection).toBe(c.landing);
  });
  it('gives every address to one entry', () => {
    const seen = new Map<string, string>();
    for (const e of entries) {
      expect(seen.get(e.url), e.url).toBeUndefined();
      seen.set(e.url, e.id);
    }
  });
  it('builds the Explorer with a folder per section and a graph with a node per page', () => {
    const rows = explorerRows(live, s.site);
    const folders = rows.filter((r) => r.kind === 'folder');
    expect(folders.length).toBeGreaterThan(0);
    for (const folder of folders) expect(folder.children.length, folder.title).toBeGreaterThan(0);
    const graph = buildGraph(live, s.site, titleIndex(live, otherEntries, s.site.otherSite.url));
    expect(graph.nodes.length).toBe(live.length);
    expect(graph.links.length).toBeGreaterThan(0);
    expect(graph.links.some((l) => l.source === l.target)).toBe(false);
  });
});
