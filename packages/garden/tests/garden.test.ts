// The garden's lib on a small made-up site: the entry model and its
// helpers, the Explorer, the graph, the pager, breadcrumbs, the head model
// and the generated text files.
import { describe, expect, it } from 'vitest';
import { breadcrumbs } from '../lib/breadcrumbs.ts';
import { check } from '../lib/check.ts';
import { atom, day, formatDate, year } from '../lib/dates.ts';
import {
  byDateDesc,
  byYear,
  childrenOf,
  mountedOn,
  published,
  sectionOf,
  toSiteEntry,
  type RawEntry,
} from '../lib/entry.ts';
import { fullUrls, pageOnly } from '../lib/feed.ts';
import { explorerRows, headerLinks, markCurrent, menu, panels, urlsIn } from '../lib/explorer.ts';
import { backlinks, buildGraph } from '../lib/graph.ts';
import { pageInfo } from '../lib/info.ts';
import { linkedPages, localTargets, wikiLinksIn } from '../lib/links.ts';
import { pager } from '../lib/pager.ts';
import { readTime, wordCount } from '../lib/readTime.ts';
import { head, inSitemap } from '../lib/seo.ts';
import type { SiteConfig } from '../lib/site.ts';
import { robotsTxt, sitemapEntries } from '../lib/textFiles.ts';
import { resolveTitle, titleIndex } from '../lib/titles.ts';
import { toc } from '../lib/toc.ts';

const site: SiteConfig = {
  name: 'Garden',
  url: 'https://garden.test',
  locale: 'en_MY',
  lang: 'en',
  logo: '/media/me.jpg',
  favicon: '/favicon.svg',
  footerText: 'Footer',
  collections: {
    pages: { title: 'Pages', order: 'order' },
    essays: { title: 'Essays', landing: 'essays', article: true, feed: true, order: 'date', graphColour: 'essays' },
    problems: { title: 'Problems', landing: 'problems', order: 'order', graphSection: true },
  },
  navigation: {
    explorer: [
      { title: 'Home', entry: 'pages/home' },
      { title: 'About', children: [{ entry: 'pages/about' }, { entry: 'pages/missing' }] },
      { entry: 'pages/essays' },
      { entry: 'pages/problems' },
      { title: 'Empty', children: [] },
    ],
    header: [{ entry: 'pages/about' }, { title: 'Hire me', url: 'https://other.test' }],
    footer: [{ title: 'Garden', children: [{ entry: 'pages/about' }, { title: 'Mail', url: 'mailto:x@y' }] }],
  },
  authors: { me: { name: 'Me', url: 'https://other.test/me' } },
  otherSite: { name: 'Other', url: 'https://other.test' },
  seo: { defaultDescription: 'A garden.', publisher: { type: 'Person' } },
  marketing: { robotsDisallow: ['/cp/'], allowAiTraining: false, allowAiSearch: true },
};
const urlOf = (collection: string, id: string) =>
  collection === 'pages'
    ? id === 'home'
      ? '/'
      : `/${id}`
    : collection === 'problems'
      ? `/${id}`
      : `/${collection}/${id}`;

const raws: RawEntry[] = [
  { collection: 'pages', id: 'home', data: { title: 'Home', order: 0 }, body: 'See [[About]] and [[Newer]].' },
  { collection: 'pages', id: 'about', data: { title: 'About', order: 1 }, body: 'Back [home](/).' },
  { collection: 'pages', id: 'essays', data: { title: 'Essays', order: 2 }, body: '' },
  { collection: 'pages', id: 'problems', data: { title: 'Problems', order: 3 }, body: '' },
  {
    collection: 'essays',
    id: 'older',
    data: { title: 'Older Essay', date: new Date('2023-01-02T00:00:00Z'), author: 'me', series: 's', part: 1 },
    body: 'Hello world, see [[Other Page]].',
  },
  {
    collection: 'essays',
    id: 'newer',
    data: {
      title: 'Newer',
      date: new Date('2024-05-06T00:00:00Z'),
      series: 's',
      part: 2,
      seo: { canonical: 'https://x.test/n' },
    },
    body: '',
  },
  {
    collection: 'essays',
    id: 'draft',
    data: { title: 'Draft', date: new Date('2025-01-01T00:00:00Z'), draft: true },
    body: '',
  },
  { collection: 'problems', id: 'spam', data: { title: 'Spam', order: 1 }, body: '' },
  { collection: 'problems', id: 'slow', data: { title: 'Slow', order: 0 }, body: '' },
];
const entries = raws.map((r) => toSiteEntry(r, urlOf));
const live = published(entries);
const other = [
  toSiteEntry({ collection: 'pages', id: 'other-page', data: { title: 'Other Page' } }, (_c, id) => `/${id}`),
];
const titles = titleIndex(live, other, site.otherSite.url);
const at = (url: string) => live.find((e) => e.url === url)!;

describe('entries', () => {
  it('get their address from the site rule and their fields from the front matter', () => {
    expect(at('/').collection).toBe('pages');
    expect(at('/essays/older')).toMatchObject({ title: 'Older Essay', author: 'me', series: 's', part: 1, type: null });
    expect(live.map((e) => e.id)).not.toContain('draft');
    expect(
      toSiteEntry({ collection: 'notes', id: 'n', data: { title: 'N', date: '2024-01-01' } }, urlOf),
    ).toMatchObject({
      type: 'text',
      date: new Date('2024-01-01'),
    });
  });
  it('know sections, landing pages and listing order', () => {
    expect(mountedOn(at('/essays'), site)).toBe('essays');
    expect(sectionOf(at('/essays/older'), site)).toBe('essays');
    expect(sectionOf(at('/about'), site)).toBeNull();
    expect(childrenOf('essays', entries, site).map((e) => e.id)).toEqual(['newer', 'older']);
    expect(childrenOf('problems', entries, site).map((e) => e.id)).toEqual(['slow', 'spam']);
    expect(byDateDesc(entries.filter((e) => e.collection === 'essays')).map((e) => e.id)).toEqual([
      'draft',
      'newer',
      'older',
    ]);
    expect(byYear(childrenOf('essays', entries, site)).map(([y, es]) => [y, es.length])).toEqual([
      ['2024', 1],
      ['2023', 1],
    ]);
  });
});

describe('explorer and navigation', () => {
  const rows = explorerRows(live, site);
  it('lists pages before folders, sections as folders, and drops what is missing or empty', () => {
    expect(rows.map((r) => `${r.kind}:${r.title}`)).toEqual([
      'page:Home',
      'folder:About',
      'folder:Essays',
      'folder:Problems',
    ]);
    expect(rows[1]!.children.map((c) => c.url)).toEqual(['/about']);
    expect(rows[2]!.children.map((c) => c.url)).toEqual(['/essays/newer', '/essays/older']);
    expect(urlsIn(rows[2]!)).toEqual(['/essays', '/essays/newer', '/essays/older']);
  });
  it('opens the folders that hold the current page', () => {
    const marked = markCurrent(rows, at('/essays/older'), '/essays/older');
    expect(marked[2]!.isOpen).toBe(true);
    expect(marked[2]!.children.find((c) => c.isCurrent)?.url).toBe('/essays/older');
    expect(marked[1]!.isOpen).toBe(false);
  });
  it('gives the header its links, the drawer what the Explorer lacks, and a room only a drawer', () => {
    expect(headerLinks(live, site, '/about').map((l) => `${l.url}${l.isCurrent ? '*' : ''}`)).toEqual([
      '/about*',
      'https://other.test',
    ]);
    expect(menu(live, site, '/', rows)).toEqual([]);
    expect(panels(live, site, false)).toEqual({ hasExplorer: true, hasDrawer: true });
    expect(panels(live, site, true)).toEqual({ hasExplorer: false, hasDrawer: true });
  });
});

describe('links and the graph', () => {
  it('reads wiki links and path links off the Markdown, and none in code, escapes or HTML blocks', () => {
    expect(wikiLinksIn('See [[A]] and [[A|this]].')).toEqual(['A', 'A']);
    expect(wikiLinksIn('```\n[[A]]\n```\n\nand `[[A]]` and \\[\\[A\\]\\]')).toEqual([]);
    expect(wikiLinksIn('<div>\n[[A]]\n</div>')).toEqual([]);
    expect(wikiLinksIn('| a |\n| - |\n| [[A\\|x]] |')).toEqual(['A\\']);
    expect(localTargets('![a](/media/a.png) <img src="/media/b.png">\n\n    [c](/media/c.png)')).toEqual([
      '/media/a.png',
      '/media/b.png',
    ]);
    const urls = new Map(live.map((e) => [e.url, e]));
    expect(linkedPages('[[About]], [x](/essays/older#top) and `[y](/)`', titles, urls).map((e) => e.url)).toEqual([
      '/about',
      '/essays/older',
    ]);
  });
  it('resolves titles case-insensitively, on this site over the other, trimming a table cell backslash', () => {
    expect(resolveTitle(titles, 'older essay')).toBe('/essays/older');
    expect(resolveTitle(titles, 'Older Essay\\')).toBe('/essays/older');
    expect(resolveTitle(titles, 'Other Page')).toBe('https://other.test/other-page');
    expect(resolveTitle(titles, 'Draft')).toBeNull();
  });
  it('has a node per published page and an edge per link, with backlinks by title', () => {
    const graph = buildGraph(live, site, titles);
    expect(graph.nodes.length).toBe(live.length);
    expect(graph.links).toEqual([
      { source: 'pages/home', target: 'pages/about' },
      { source: 'pages/home', target: 'essays/newer' },
      { source: 'pages/about', target: 'pages/home' },
    ]);
    expect(graph.nodes.find((n) => n.id === 'essays/older')).toMatchObject({
      section: 'essays',
      section_title: 'Essays',
    });
    expect(backlinks(graph, at('/about')).map((b) => b.url)).toEqual(['/']);
  });
});

describe('pager, breadcrumbs, info, outline', () => {
  it('pages through a series by part, and nothing else', () => {
    expect(pager(at('/essays/older'), live).next?.id).toBe('newer');
    expect(pager(at('/essays/newer'), live).previous?.id).toBe('older');
    expect(pager(at('/about'), live)).toEqual({ previous: null, next: null });
  });
  it('walks the address for breadcrumbs', () => {
    expect(breadcrumbs('/essays/older', live).map((c) => c.url)).toEqual(['/', '/essays', '/essays/older']);
    expect(breadcrumbs('/essays/type/x', live).map((c) => c.url)).toEqual(['/', '/essays']);
  });
  it('describes a page: eyebrow, feed, source, graph section', () => {
    const info = pageInfo(at('/essays/older'), site);
    expect(info).toMatchObject({ eyebrow: '2023-01-02 · 1 min read', feedUrl: '/essays/feed.xml', section: 'essays' });
    expect(pageInfo(at('/'), site)).toMatchObject({ isHome: true, eyebrow: null, feedUrl: null });
    expect(pageInfo(at('/essays/newer'), site).source).toBe('https://x.test/n');
    expect(pageInfo(at('/problems'), site).graphSection).toBe('problems');
    expect(pageInfo(at('/essays'), site).graphSection).toBeNull();
  });
  it('keeps an outline only from two h2/h3 headings up', () => {
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
  const input = (page: ReturnType<typeof at>, extra = {}) => ({ page, path: page.url, site, live, ...extra });
  it('titles, describes and types pages', () => {
    const essay = head(input(at('/essays/older')));
    expect(essay.title).toBe('Older Essay | Garden');
    expect(essay.ogType).toBe('article');
    expect(essay.robots).toBe('max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    expect(essay.graph.map((n) => n['@type'])).toEqual(['WebSite', 'Person', 'WebPage', 'BreadcrumbList', 'Article']);
    expect(essay.graph.find((n) => n['@type'] === 'Article')!.author).toEqual([
      { '@id': 'https://other.test/#publisher', '@type': 'Person', name: 'Me', url: 'https://other.test/me' },
    ]);
    expect(head(input(at('/essays/newer'))).canonical).toBe('https://x.test/n');
    const home = head(input(at('/')));
    expect(home.title).toBe('Garden');
    expect(home.canonical).toBe('https://garden.test');
    expect(home.image?.url).toBe('https://garden.test/og.png');
    const listing = head({
      page: null,
      path: '/essays/type/x',
      site,
      live,
      overrides: { title: 'X', description: 'D' },
    });
    expect(listing.title).toBe('X | Garden');
    expect(listing.graph.map((n) => n['@type'])).toEqual(['WebSite', 'Person']);
    expect(head({ page: null, path: '/404', site, live, status: 404 })).toMatchObject({
      canonical: null,
      robots: 'noindex, follow',
      graph: [],
    });
  });
  it('names the publisher: a Person with the employers its config gives, an Organization founded by the other site', () => {
    const person = (config: SiteConfig) =>
      head(input(at('/'), { site: config })).graph.find((n) => n['@id'] === `${config.url}/#publisher`)!;
    expect(person(site).worksFor).toBeUndefined();
    const employed: SiteConfig = {
      ...site,
      seo: {
        ...site.seo,
        publisher: { type: 'Person', jobTitle: 'Head', worksFor: [{ name: 'Firm', url: 'https://firm.test' }] },
      },
    };
    expect(person(employed)).toMatchObject({
      jobTitle: 'Head',
      worksFor: [{ '@type': 'Organization', name: 'Firm', url: 'https://firm.test' }],
    });
    const org: SiteConfig = { ...site, seo: { ...site.seo, publisher: { type: 'Organization' } } };
    expect(person(org)).toMatchObject({
      founder: { '@type': 'Person', '@id': 'https://other.test/#publisher' },
    });
    expect(person(org).worksFor).toBeUndefined();
  });
  it('points og:url where rel=canonical points, and keeps a listing out of search when asked', () => {
    const republished = head(input(at('/essays/newer')));
    expect(republished.url).toBe('https://x.test/n');
    expect(republished.graph.find((n) => n['@type'] === 'WebPage')!['@id']).toBe(
      'https://garden.test/essays/newer#webpage',
    );
    expect(head(input(at('/essays/older'))).url).toBe('https://garden.test/essays/older');
    expect(head({ page: null, path: '/x', site, live, overrides: { noindex: true } }).robots).toBe('noindex, follow');
  });
  it('makes a feed body stand alone: absolute addresses, #links to the page, no page-only markup', () => {
    expect(
      fullUrls(
        '<a href="/x">x</a> <a href="#h">h</a> <a href="//cdn.test/y">y</a> <img src="/a.png" srcset="/a.png 1x, /b.png 2x">',
        'https://garden.test/',
        'https://garden.test/essays/older',
      ),
    ).toBe(
      '<a href="https://garden.test/x">x</a> <a href="https://garden.test/essays/older#h">h</a> <a href="//cdn.test/y">y</a> <img src="https://garden.test/a.png" srcset="https://garden.test/a.png 1x, https://garden.test/b.png 2x">',
    );
    expect(
      pageOnly(
        '<img class="wiki-logo-light" src="/l.svg"><img class="wiki-logo-dark" src="/d.svg"><div><button class="code-block-copy" type="button">Copy</button><pre>x</pre></div>',
      ),
    ).toBe('<img class="wiki-logo-light" src="/l.svg"><div><pre>x</pre></div>');
  });
  it('lists only canonical, indexable pages in the sitemap, and writes robots.txt', () => {
    expect(inSitemap(at('/essays/newer'), site)).toBe(false);
    expect(sitemapEntries(entries, site).map((e) => e.loc)).toEqual([
      'https://garden.test',
      'https://garden.test/about',
      'https://garden.test/essays',
      'https://garden.test/essays/older',
      'https://garden.test/problems',
      'https://garden.test/slow',
      'https://garden.test/spam',
    ]);
    expect(robotsTxt(site)).toBe(
      'User-agent: *\nDisallow: /cp/\n\nUser-agent: GPTBot\nUser-agent: ClaudeBot\nUser-agent: Google-Extended\nUser-agent: Applebot-Extended\nUser-agent: CCBot\nDisallow: /\n\nSitemap: https://garden.test/sitemap-index.xml\n',
    );
  });
});

describe('content check', () => {
  // The fixture's Explorer names a missing page on purpose (the Explorer test); a sound site does not.
  const sound: SiteConfig = {
    ...site,
    navigation: {
      ...site.navigation,
      explorer: site.navigation.explorer.map((item) => ({
        ...item,
        children: item.children?.filter((c) => c.entry !== 'pages/missing'),
      })),
    },
    redirects: { '/old-about': '/about', '/gone': '/essays#top', '/moved': 'https://other.test/other-page' },
  };
  const run = (extra: RawEntry[] = [], config: SiteConfig = sound) =>
    check({
      root: '/nowhere',
      site: config,
      urlOf,
      raws: [...raws, ...extra],
      other: { entries: other, url: site.otherSite.url },
    });
  it('passes a sound site', () => {
    expect(run()).toEqual([]);
  });
  it('flags bad file names, a title [[wiki links]] cannot name, a link to a missing page, a bad reference and an unknown author', () => {
    const problems = run([
      {
        collection: 'essays',
        id: 'Bad_Name',
        data: { title: 'A [bracketed] title', date: new Date(), author: 'nobody', related: ['essays/nothing'] },
        body: '[[No Such Page]]\n\n~~~\n[[Also Missing]]\n~~~\n\n[x](/nowhere)',
      },
      { collection: 'essays', id: 'selfish', data: { title: 'Selfish', date: new Date(), related: 'essays/selfish' } },
    ]);
    expect(problems).toContainEqual(expect.stringContaining('name it with [a-z0-9-] only'));
    expect(problems).toContainEqual(expect.stringContaining('has [, ] or |'));
    expect(problems).toContainEqual(expect.stringContaining('[[No Such Page]] names no published page'));
    expect(problems).toContainEqual(expect.stringContaining('/nowhere is not a page'));
    expect(problems).toContainEqual(expect.stringContaining('its related essays/nothing names no page'));
    expect(problems).toContainEqual(expect.stringContaining('/essays/selfish: its related names itself'));
    expect(problems).toContainEqual(expect.stringContaining('its author nobody is not in site.config.ts'));
    expect(problems.join('\n')).not.toContain('Also Missing');
  });
  it('flags a navigation item that names no published page', () => {
    expect(run([], site)).toEqual([
      'navigation.explorer: pages/missing names no published page, so it would be left out.',
    ]);
    const drafted = { ...sound, navigation: { ...sound.navigation, header: [{ entry: 'essays/draft' }] } };
    expect(run([], drafted)).toContainEqual(expect.stringContaining('navigation.header: essays/draft'));
  });
  it('flags a redirect from a page, or to a page that does not exist on either site', () => {
    const bad = {
      ...sound,
      redirects: {
        '/about': '/essays',
        '/old': '/nowhere',
        '/away': 'https://other.test/nothing',
        '/out': 'https://x.test/',
      },
    };
    expect(run([], bad)).toEqual([
      "redirects: /about is a page's own address.",
      'redirects: /old → /nowhere is not a page.',
      'redirects: /away → https://other.test/nothing is not a page.',
    ]);
  });
  it('flags a title used twice, on either site', () => {
    expect(run([{ collection: 'essays', id: 'x', data: { title: 'other page', date: new Date() } }])).toContainEqual(
      expect.stringContaining('"other page" is the title of 2 pages'),
    );
  });
});

describe('dates and read time', () => {
  it('print in Kuala Lumpur, Atom dates in UTC', () => {
    const late = new Date('2026-10-07T17:30:00Z'); // 01:30 the next day in KL
    expect(day(late)).toBe('2026-10-08');
    expect(year(new Date('2020-12-31T18:00:00Z'))).toBe('2021');
    expect(formatDate(late, 'j F Y')).toBe('8 October 2026');
    expect(formatDate(late, 'M')).toBe('Oct');
    expect(atom(new Date('2023-01-18T00:00:00Z'))).toBe('2023-01-18T00:00:00+00:00');
  });
  it('counts words as Statamic did', () => {
    expect(wordCount("Don't count <b>tags</b>, 0 or punctuation... but 10 yes")).toBe(8);
    expect(readTime('word '.repeat(201))).toBe(2);
    expect(readTime('')).toBe(0);
  });
});
