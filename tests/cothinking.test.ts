// cothink.ing: what only its content uses, on its imported content: the
// Explorer grouped by the collections.yaml flags, rooms and their panels, the
// series pager, the reshare, authors and the Organization publisher, against
// what the Laravel app printed (DEV_FILES/cothinking/golden) where it can.
// Skipped when the site's data is missing.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { check } from '../scripts/check-content.ts';
import { loadProject } from '../garden/lib/files.ts';
import { explorerRows, panels } from '../garden/lib/explorer.ts';
import { pageInfo } from '../garden/lib/entry.ts';
import { pager } from '../garden/lib/pager.ts';
import { byUrl, published } from '../garden/lib/pages.ts';
import { head, inSitemap } from '../garden/lib/seo.ts';

const root = path.resolve(__dirname, '../sites/cothinking');
const present = fs.existsSync(path.join(root, 'src/data/site.yaml'));
const project = loadProject(root);
const { pages, collections, site, authors } = project;
const live = published(pages);
const urls = byUrl(live);
const page = (url: string) => urls.get(url)!;
// The Laravel site's pages (`npm run golden:cothinking`, git-ignored): the tests that compare with them skip without it.
const golden = path.resolve(__dirname, '../DEV_FILES/cothinking/golden/pages');
const hasGolden = fs.existsSync(golden);

describe.skipIf(!present)('cothink.ing: explorer and panels', () => {
  const rows = explorerRows(project);
  it('groups the wiki by category and lists only the work with a write-up', () => {
    const wiki = rows.find((r) => r.url === '/wiki')!;
    expect(wiki.children.map((c) => c.url)).toEqual([
      '/wiki#choosing-a-provider',
      '/wiki#email-and-security',
      '/wiki#leads-and-measurement',
      '/wiki#search',
      '/wiki#ownership-and-compliance',
      '/wiki#setting-up-it',
    ]);
    const work = rows.find((r) => r.url === '/work')!;
    const written = live.filter((p) => p.collection === 'work' && p.body.trim() !== '');
    expect(work.children.map((c) => c.url).sort()).toEqual(written.map((p) => p.url).sort());
    expect(written.length).toBeLessThan(live.filter((p) => p.collection === 'work').length);
  });
  it.skipIf(!hasGolden)('matches the data-path list the Laravel site printed', () => {
    const html = fs.readFileSync(path.join(golden, 'wiki/speed-to-lead.html'), 'utf8');
    const printed = [...html.matchAll(/data-path="([^"]*)"/g)].map(
      (m) => m[1]!.replace('http://cothinking.localhost:8004', '') || '/',
    );
    const ours = rows.flatMap(function paths(r): string[] {
      return [r.url ?? `#${r.title.toLowerCase().replace(/\s+/g, '-')}`, ...r.children.flatMap(paths)];
    });
    expect(ours).toEqual(printed);
  });
  it('gives a room no Explorer on a site without one, but a drawer for the menu', () => {
    expect(panels(project, true)).toEqual({ hasExplorer: false, hasDrawer: true });
    expect(panels(project, false)).toEqual({ hasExplorer: true, hasDrawer: true });
    expect(site.attributes.closed_panels).toEqual(['explorer']);
  });
});

describe.skipIf(!present)('cothink.ing: pages', () => {
  it('pages through a series by part, and nothing else', () => {
    const second = pager(page('/wiki/boring-office-part-2-the-keys'), pages);
    expect(second.previous?.url).toBe('/wiki/boring-office-part-1-overview');
    expect(second.next?.url).toBe('/wiki/boring-office-part-3-password-managers');
    expect(pager(page('/wiki/speed-to-lead'), pages)).toEqual({ previous: null, next: null });
  });
  it('widens the graph to the whole section on the landing pages with `graph_section`', () => {
    expect(pageInfo(page('/wiki'), pages, collections, site).graphSection).toBe('wiki');
    expect(pageInfo(page('/problem-statements'), pages, collections, site).graphSection).toBe('problems');
    expect(pageInfo(page('/work'), pages, collections, site).graphSection).toBeNull();
  });
  it('shows a reshared essay, sends search engines to it and leaves it out of the sitemap', () => {
    const reshare = page('/wiki/blast-stack');
    const info = pageInfo(reshare, pages, collections, site);
    expect(info.original?.collection).toBe('reshared');
    expect(info.source).toBe('https://jothamlim.com/essays/blast-stack');
    const h = head({ page: reshare, path: reshare.url, site, collections, pages: live, original: info.original });
    expect(h.canonical).toBe('https://jothamlim.com/essays/blast-stack');
    expect(inSitemap(reshare, site)).toBe(false);
    // The reshared piece has no address here.
    expect(info.original?.url).toBeNull();
  });
});

describe.skipIf(!present)('cothink.ing: head', () => {
  it('describes the publisher as an Organization with its founder', () => {
    const h = head({ page: page('/'), path: '/', site, collections, pages: live });
    const publisher = h.graph.find((n) => n['@id'] === 'https://cothink.ing/#publisher')!;
    expect(publisher).toMatchObject({
      '@type': 'Organization',
      legalName: 'Thinkers Collective Enterprise',
      areaServed: 'Malaysia',
      founder: { '@type': 'Person', '@id': 'https://jothamlim.com/#publisher' },
    });
    expect(publisher.contactPoint).toEqual([
      expect.objectContaining({ '@type': 'ContactPoint', contactType: 'customer service' }),
    ]);
  });
  it("names an article's author, the other site's Person", () => {
    const entry = page('/wiki/speed-to-lead');
    const article = head({ page: entry, path: entry.url, site, collections, pages: live, authors }).graph.find(
      (n) => n['@type'] === 'Article',
    )!;
    expect(article.author).toEqual([
      {
        '@id': 'https://jothamlim.com/#publisher',
        '@type': 'Person',
        name: 'Jotham Lim',
        url: 'https://jothamlim.com/career',
      },
    ]);
  });
});

describe.skipIf(!present)('cothink.ing: content check', () => {
  it('passes the content as it is', () => {
    expect(check(project)).toEqual([]);
  });
  it('flags a reshare of a missing page, an unknown author and a reshared piece without its address', () => {
    const broken = structuredClone(project);
    const entry = broken.pages.find((p) => p.url === '/wiki/speed-to-lead')!;
    entry.data.reshare = 'reshared/nothing-here';
    entry.data.author = 'someone-else';
    broken.pages.find((p) => p.collection === 'reshared')!.data.url = 'https://example.com/x';
    const problems = check(broken);
    expect(problems).toContain('/wiki/speed-to-lead: its reshare reshared/nothing-here names no page.');
    expect(problems).toContain('/wiki/speed-to-lead: its author someone-else is not in src/data/authors.yaml.');
    expect(problems.some((p) => p.includes('a reshared piece needs its address on https://jothamlim.com'))).toBe(true);
  });
});
