// Every site in sites/*: its config and content, scanned off the disk, pass
// the content check (garden/lib/check.ts) and hold together: a home page, a
// landing page per section, the Explorer's folders, a graph with a node per
// page, a title for every [[wiki link]] either site makes to the other. When
// a site is built, every published page has its file in dist/.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { check } from '../lib/check.ts';
import { indexByUrl, published, toSiteEntry, makeUrlOf } from '../lib/entry.ts';
import { explorerRows } from '../lib/explorer.ts';
import { buildGraph } from '../lib/graph.ts';
import { scanRaw } from '../lib/scan.ts';
import type { SiteConfig } from '../lib/site.ts';
import { linkIndex } from '../lib/linkIndex.ts';

const sitesDir = path.resolve(__dirname, '../../../sites');
const names = fs.readdirSync(sitesDir).filter((n) => fs.existsSync(path.join(sitesDir, n, 'src/site.config.ts')));

type Loaded = { name: string; root: string; site: SiteConfig };
const loaded: Loaded[] = await Promise.all(
  names.map(async (name) => {
    const root = path.join(sitesDir, name);
    const { site } = (await import(pathToFileURL(path.join(root, 'src/site.config.ts')).href)) as { site: SiteConfig };
    return { name, root, site };
  }),
);
const otherOf = (s: Loaded) =>
  loaded.find((o) => o.name === s.site.otherSite.folder && o.site.url === s.site.otherSite.url) ?? null;

describe.each(loaded)('$name', (s) => {
  const raws = scanRaw(s.root);
  const entries = raws.map((r) => toSiteEntry(r, s.site));
  const live = published(entries);
  const other = otherOf(s);
  const otherEntries = other ? published(scanRaw(other.root).map((r) => toSiteEntry(r, other.site))) : [];
  const dist = path.join(s.root, 'dist');

  it('names its other site, which is in sites/ too', () => {
    expect(other).not.toBeNull();
  });
  it('passes the content check', () => {
    expect(
      check({
        root: s.root,
        site: s.site,
        raws,
        other: { entries: otherEntries, url: s.site.otherSite.url, folder: s.site.otherSite.folder },
      }),
    ).toEqual([]);
  });
  it('has a home page and a landing page for every section', () => {
    const urls = indexByUrl(live);
    expect(urls.get('/')?.collection).toBe('pages');
    for (const [collection, c] of Object.entries(s.site.collections))
      if (c.landing) expect(urls.get(makeUrlOf(s.site)('pages', c.landing))?.id, collection).toBe(c.landing);
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
    const index = linkIndex(live, otherEntries, s.site.otherSite.url, s.site.otherSite.folder);
    const graph = buildGraph(live, s.site, index);
    expect(graph.nodes.length).toBe(live.length);
    expect(graph.links.length).toBeGreaterThan(0);
    expect(graph.links.some((l) => l.source === l.target)).toBe(false);
  });
  it.skipIf(!fs.existsSync(dist))('builds a page for every published entry, where makeUrlOf says', () => {
    const missing = live
      .map((e) => (e.url === '/' ? 'index.html' : `${e.url.slice(1)}.html`))
      .filter((file) => !fs.existsSync(path.join(dist, file)));
    expect(missing).toEqual([]);
  });
});
