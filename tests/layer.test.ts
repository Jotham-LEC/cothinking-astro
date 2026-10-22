// The wiki layer on the imported content: the Explorer and menu, the
// graph and backlinks, the pager, the years, the note types, breadcrumbs and
// the head model, against what the Laravel app printed (DEV_FILES/golden).
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadProject } from '../src/lib/files.ts';
import { explorerRows, markCurrent, menu, urlsIn } from '../src/lib/explorer.ts';
import { backlinks, buildGraph } from '../src/lib/graph.ts';
import { pager } from '../src/lib/pager.ts';
import { years } from '../src/lib/years.ts';
import { noteType, noteTypes } from '../src/lib/noteTypes.ts';
import { breadcrumbs } from '../src/lib/breadcrumbs.ts';
import { pageInfo } from '../src/lib/entry.ts';
import { linkedPages, localTargets, wikiLinksIn } from '../src/lib/links.ts';
import { byUrl, published, toPages } from '../src/lib/pages.ts';
import { redirectsFor } from '../src/lib/redirects.ts';
import { head, inSitemap } from '../src/lib/seo.ts';
import { toc } from '../src/lib/toc.ts';
import { robotsTxt, sitemapEntries } from '../src/lib/textFiles.ts';

const root = path.resolve(__dirname, '..');
const project = loadProject(root);
const { pages, collections, site, titles } = project;
const live = published(pages);
const urls = byUrl(live);
const page = (url: string) => urls.get(url)!;
// The Laravel site's pages (`npm run golden`, git-ignored): the tests that compare with them skip without it, loudly.
const golden = path.join(root, 'DEV_FILES/golden/pages');
const hasGolden = fs.existsSync(golden);
if (!hasGolden) console.warn('golden set missing: run `npm run golden`; the Laravel comparison tests are skipped.');

describe('explorer', () => {
  const rows = explorerRows(project);
  it('lists pages before folders, with the sections as folders', () => {
    expect(rows.map((r) => `${r.kind}:${r.title}`)).toEqual([
      'page:🏠 Home',
      'folder:About me',
      'folder:Essays',
      'folder:Notes',
      'folder:Projects',
      'folder:Publications',
    ]);
    const notes = rows.find((r) => r.title === 'Notes')!;
    expect(notes.children.map((c) => `${c.kind} ${c.url}`)).toEqual([
      'type /notes/type/text',
      'type /notes/type/quote',
    ]);
    const publications = rows.find((r) => r.title === 'Publications')!;
    expect(publications.children[0]!.url).toBe('/publications#2026');
    expect(publications.children.map((c) => c.title)).toEqual(['2026', '2024', '2023', '2021', '2020', '2019']);
  });
  it('opens the folders that hold the current page', () => {
    const marked = markCurrent(rows, page('/essays/blast-stack'), '/essays/blast-stack');
    const essays = marked.find((r) => r.title === 'Essays')!;
    expect(essays.isOpen).toBe(true);
    expect(essays.children.find((c) => c.isCurrent)?.url).toBe('/essays/blast-stack');
    expect(marked.find((r) => r.title === 'Notes')!.isOpen).toBe(false);
    const typed = markCurrent(rows, null, '/notes/type/text');
    expect(typed.find((r) => r.title === 'Notes')!.children[0]!.isCurrent).toBe(true);
  });
  it.skipIf(!hasGolden)('matches the data-path list the Laravel site printed', () => {
    const html = fs.readFileSync(path.join(golden, 'career.html'), 'utf8');
    const printed = [...html.matchAll(/data-path="([^"]*)"/g)].map((m) => m[1]!.replace('http://localhost:8004', ''));
    const ours = rows.flatMap(function paths(r): string[] {
      return [r.url ?? `#${r.title.toLowerCase().replace(/\s+/g, '-')}`, ...r.children.flatMap(paths)];
    });
    expect(ours).toEqual(printed);
  });
  it('gives the menu the header links the Explorer lacks', () => {
    expect(menu(project, '/career', rows)).toEqual([]);
    expect(urlsIn(rows[0]!)).toEqual(['/']);
  });
});

describe('graph and backlinks', () => {
  const graph = buildGraph(pages, collections, titles);
  it('has a node per published page and edges for wiki and path links', () => {
    expect(graph.nodes.length).toBe(live.length);
    expect(graph.links).toContainEqual({ source: 'pages/home', target: 'pages/sports' });
    expect(backlinks(graph, page('/sports')).map((b) => b.url)).toContain('/');
    expect(graph.links.some((l) => l.source === l.target)).toBe(false);
  });
  it.skipIf(!hasGolden)('matches /graph.json by url', () => {
    const printed = JSON.parse(fs.readFileSync(path.join(golden, 'graph.json'), 'utf8'));
    const byId = Object.fromEntries(printed.nodes.map((n: { id: string; url: string }) => [n.id, n.url]));
    const theirs = printed.links
      .map((l: { source: string; target: string }) => `${byId[l.source]} -> ${byId[l.target]}`)
      .sort();
    const ids = Object.fromEntries(graph.nodes.map((n) => [n.id, n.url]));
    const ours = graph.links.map((l) => `${ids[l.source]} -> ${ids[l.target]}`).sort();
    expect(ours).toEqual(theirs);
  });
});

describe('links read off the Markdown', () => {
  it('finds wiki links and path links the page renders, and none in code, escapes or HTML blocks', () => {
    expect(wikiLinksIn('See [[Writing Shorter]] and [[Writing Shorter|this]].')).toEqual([
      'Writing Shorter',
      'Writing Shorter',
    ]);
    expect(wikiLinksIn('~~~\n[[Writing Shorter]]\n~~~')).toEqual([]);
    expect(wikiLinksIn('Code:\n\n    [[Writing Shorter]]\n')).toEqual([]);
    expect(wikiLinksIn('```\n[[Writing Shorter]]\n```\n\nand `[[Writing Shorter]]`')).toEqual([]);
    expect(wikiLinksIn('Write \\[\\[Writing Shorter\\]\\] to link.')).toEqual([]);
    expect(wikiLinksIn('<div>\n[[Writing Shorter]]\n</div>')).toEqual([]);
    expect(wikiLinksIn('| a |\n| - |\n| [[Writing Shorter\\|x]] |')).toEqual(['Writing Shorter\\']);
    const titles = { 'writing shorter': '/notes/writing-shorter' };
    expect(
      linkedPages('[[Writing Shorter]], [cv](/cv#top) and `[x](/sports)`', titles, urls).map((p) => p.url),
    ).toEqual(['/notes/writing-shorter', '/cv']);
    expect(localTargets('![a](/media/a.png) <img src="/media/b.png">\n\n    [c](/media/c.png)')).toEqual([
      '/media/a.png',
      '/media/b.png',
    ]);
  });
});

describe('redirects', () => {
  const fixture = (data: Record<string, unknown>, body = '') =>
    toPages(
      [
        { collection: 'pages', slug: 'essays', data: { title: 'Essays', order: 1 }, body: '' },
        { collection: 'essays', slug: 'x', data: { title: 'X', date: new Date(), ...data }, body },
      ],
      collections,
    );
  const blog = (pages: ReturnType<typeof fixture>) =>
    redirectsFor({ ...project, redirects: [], pages })['/blog/x'] ?? null;
  it('sends /blog/{slug} to a published page by its front matter, not by a line in its body', () => {
    expect(blog(fixture({}, '```yaml\ndraft: true\n```'))).toBe('/essays/x');
    expect(blog(fixture({ draft: true }))).toBeNull();
  });
  it('drops (and names) a redirect from a file address', () => {
    const out = redirectsFor({
      ...project,
      pages: [],
      redirects: [
        { source: '/a.pdf', target: '/b.pdf' },
        { source: '/a', target: '/b' },
      ],
    });
    expect(out).toEqual({ '/a': '/b' });
  });
});

describe('pager, years, note types, breadcrumbs', () => {
  it('pages through the notes by date and nothing else', () => {
    const notes = live.filter((p) => p.collection === 'notes').sort((a, b) => a.date!.getTime() - b.date!.getTime());
    expect(pager(notes[0]!, pages).previous).toBeNull();
    expect(pager(notes[notes.length - 1]!, pages).next).toBeNull();
    expect(pager(page('/essays/blast-stack'), pages)).toEqual({ previous: null, next: null });
  });
  it('groups the publications by year with outlet labels', () => {
    const groups = years(page('/publications'), live, collections);
    expect(groups.map((g) => g.year)).toEqual(['2026', '2024', '2023', '2021', '2020', '2019']);
    expect(groups.at(-1)!.pieces.at(-1)!.outlet).toMatch(/Insight|Edge|Report|Press/);
    expect(years(page('/career'), live, collections)).toEqual([]);
  });
  it('names only the note types in use', () => {
    expect(noteTypes(live, collections).map((t) => t.handle)).toEqual(['text', 'quote']);
    expect(noteType('quote', live, collections)).toMatchObject({
      title: 'Quote',
      seoTitle: 'Quote notes',
      seoDescription: 'Every quote note, newest first.',
    });
    expect(noteType('photo', live, collections)).toBeNull();
  });
  it('walks the address for breadcrumbs', () => {
    expect(breadcrumbs('/essays/blast-stack', live).map((c) => c.url)).toEqual(['/', '/essays', '/essays/blast-stack']);
    expect(breadcrumbs('/notes/type/text', live).map((c) => c.url)).toEqual(['/', '/notes']);
  });
  it('describes a page: eyebrow, feed, source, outline', () => {
    const info = pageInfo(page('/essays/being-personal-in-the-workplace'), collections, site);
    expect(info.eyebrow).toBe('2023-01-18 · 8 min read');
    expect(info.feedUrl).toBe('/essays/feed.xml');
    expect(pageInfo(page('/'), collections, site)).toMatchObject({ isHome: true, eyebrow: null, feedUrl: null });
    const publication = live.find((p) => p.collection === 'publications' && p.seo.canonical)!;
    expect(pageInfo(publication, collections, site).source).toBe(publication.seo.canonical);
    expect(toc([{ depth: 2, slug: 'a', text: 'A' }])).toEqual([]);
    expect(
      toc([
        { depth: 2, slug: 'a', text: 'A' },
        { depth: 3, slug: 'b', text: ' B  c ' },
        { depth: 4, slug: 'd', text: 'D' },
      ]),
    ).toEqual([
      { level: 2, id: 'a', text: 'A' },
      { level: 3, id: 'b', text: 'B c' },
    ]);
  });
});

describe('head and generated files', () => {
  const input = (p: ReturnType<typeof page>, extra = {}) => ({
    page: p,
    path: p.url,
    site,
    collections,
    pages: live,
    ...extra,
  });
  it('titles, describes and types pages as the addon did', () => {
    const essay = head(input(page('/essays/being-personal-in-the-workplace')));
    expect(essay.title).toBe('Being Personal in the Workplace | Jotham Lim');
    expect(essay.ogType).toBe('article');
    expect(essay.robots).toBe('max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    expect(essay.graph.map((n) => n['@type'])).toEqual(['WebSite', 'Person', 'WebPage', 'BreadcrumbList', 'Article']);
    const home = head(input(page('/')));
    expect(home.title).toBe('Jotham Lim');
    expect(home.ogType).toBe('profile');
    expect(home.canonical).toBe('https://jothamlim.com');
    expect(home.graph.map((n) => n['@type'])).toEqual(['WebSite', 'Person', 'ProfilePage']);
    const long = head(
      input(page('/essays/misconceptions-about-group-decision-making-tips-for-better-business-communication')),
    );
    expect(long.title).not.toContain('|');
    const listing = head({
      page: null,
      path: '/notes/type/text',
      site,
      collections,
      pages: live,
      overrides: { title: 'Text notes', description: 'Every text note, newest first.' },
    });
    expect(listing.title).toBe('Text notes | Jotham Lim');
    // A later page of a paginated listing is its own canonical address.
    const second = head(input(page('/notes'), { path: '/notes/2' }));
    expect(second.canonical).toBe('https://jothamlim.com/notes/2');
    expect(second.url).toBe('https://jothamlim.com/notes/2');
    expect(listing.graph.map((n) => n['@type'])).toEqual(['WebSite', 'Person']);
    expect(head({ page: null, path: '/404', site, collections, pages: live, status: 404 })).toMatchObject({
      canonical: null,
      robots: 'noindex, follow',
      graph: [],
    });
  });
  it('lists only canonical, indexable pages in the sitemap', () => {
    const entries = sitemapEntries(pages, site);
    expect(entries.length).toBe(59);
    expect(entries[0]!.loc).toBe('https://jothamlim.com');
    expect(live.filter((p) => p.collection === 'publications' && inSitemap(p, site)).length).toBe(6);
    expect(robotsTxt(site)).toBe('User-agent: *\nDisallow: /cp/\n\nSitemap: https://jothamlim.com/sitemap-index.xml\n');
  });
});
