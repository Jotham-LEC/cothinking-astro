// The content rules a schema cannot see, one function each (run by tests/sites.test.ts over both sites).
// DEV_FILES/wiki/01-content-and-sites.md, "The content check", lists them.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findByKey, keyOf, published, toSiteEntry, type RawEntry, type SiteEntry } from './entry.ts';
import { fileLinksIn, fileOf, firstHeadingDepth, localTargets, wikiLinksIn } from './links.ts';
import { pathOf, type NavItem, type SiteConfig } from './site.ts';
import { fileTarget, linkIndex, normaliseTitle, resolveFile, resolveTitle, type LinkIndex } from './linkIndex.ts';

const ID = /^[a-z0-9-]+$/;
const REFERENCE = /^([a-z_]+)\/([a-z0-9-]+)$/;

export type CheckInput = {
  root: URL | string;
  site: SiteConfig;
  raws: RawEntry[];
  /** The other site's published entries, address and folder under sites/, for the link index and the uniqueness of titles. */
  other: { entries: SiteEntry[]; url: string; folder: string };
};

/** What every rule reads: the site, its entries (drafts too) and published ones, the link index, the path rule. */
type Context = CheckInput & {
  entries: SiteEntry[];
  live: SiteEntry[];
  index: LinkIndex;
  urls: Set<string>;
  /** A site path a link may name: a page, a known route, or a file in public/; else what is wrong with it. */
  pathProblem: (path: string) => string | null;
};

const where = (p: SiteEntry) => p.url;

/** Every collection folder is in the config, every landing page exists, every file name is an id. */
function checkIds({ site, raws, entries }: Context): string[] {
  const problems: string[] = [];
  for (const collection of new Set(raws.map((r) => r.collection)))
    if (!site.collections[collection]) problems.push(`src/content/${collection}: not in site.config.ts.`);
  for (const [collection, config] of Object.entries(site.collections))
    if (config.landing && !findByKey(entries, `pages/${config.landing}`))
      problems.push(`${collection}: its landing page pages/${config.landing} does not exist.`);
  for (const raw of raws)
    if (!ID.test(raw.id)) problems.push(`src/content/${raw.collection}/${raw.id}.md: name it with [a-z0-9-] only.`);
  return problems;
}

/** Every navigation item that names an entry names a published one (the Explorer, header and footer would drop it in silence). */
function checkNavigation({ site, live }: Context): string[] {
  const navItems = (items: NavItem[]): NavItem[] => items.flatMap((item) => [item, ...navItems(item.children ?? [])]);
  return Object.entries(site.navigation).flatMap(([menu, items]) =>
    navItems(items)
      .filter((item) => item.entry && !findByKey(live, item.entry))
      .map((item) => `navigation.${menu}: ${item.entry} names no published page, so it would be left out.`),
  );
}

/** Every redirect leaves an address no page uses, for a page that exists on this site or the other. */
function checkRedirects({ site, other, urls, pathProblem }: Context): string[] {
  const problems: string[] = [];
  const otherBase = other.url.replace(/\/$/, '');
  for (const [from, to] of Object.entries(site.redirects ?? {})) {
    if (urls.has(pathOf(from))) problems.push(`redirects: ${from} is a page's own address.`);
    if (to.startsWith(`${otherBase}/`)) {
      const path = pathOf(to.slice(otherBase.length));
      if (!other.entries.some((e) => e.url === path)) problems.push(`redirects: ${from} → ${to} is not a page.`);
      continue;
    }
    if (!to.startsWith('/')) continue;
    const problem = pathProblem(decodeURIComponent(to.split(/[?#]/)[0]!));
    if (problem) problems.push(`redirects: ${from} → ${problem}`);
  }
  return problems;
}

/** Every published page: its [[wiki links]] and site paths lead somewhere, its first heading is ##, it is no sample. */
function checkLinks({ live, index, pathProblem }: Context): string[] {
  const problems: string[] = [];
  for (const page of live) {
    const body = page.body + '\n\n' + (page.quote ?? '');
    for (const title of wikiLinksIn(body))
      if (!resolveTitle(index, title)) problems.push(`${where(page)}: [[${title}]] names no published page.`);
    for (const link of fileLinksIn(page.body))
      if (!resolveFile(index, fileTarget(index, fileOf(page), link)))
        problems.push(`${where(page)}: (${link}) names no published page.`);
    for (const target of localTargets(body)) {
      const problem = pathProblem(decodeURIComponent(target.split(/[?#]/)[0]!));
      if (problem) problems.push(`${where(page)}: ${problem}`);
    }
    const depth = firstHeadingDepth(page.body);
    if (depth !== null && depth !== 2)
      problems.push(`${where(page)}: its first heading is ${'#'.repeat(depth)}; start at ## (the title is the h1).`);
    if (page.title.startsWith('Sample:')) problems.push(`${where(page)}: a sample page is still here.`);
  }
  return problems;
}

/** Every page, drafts too: an ordered collection's page has its `order`; a field naming `collection/id` names another page that exists. */
function checkReferences({ site, raws, entries }: Context): string[] {
  const problems: string[] = [];
  for (const raw of raws) {
    const page = entries.find((e) => keyOf(e) === keyOf(raw))!;
    if (site.collections[page.collection]?.order === 'order' && page.order === null)
      problems.push(`${where(page)}: no order, in an ordered collection.`);
    for (const [field, value] of Object.entries(raw.data)) {
      for (const key of [value].flat()) {
        if (typeof key !== 'string') continue;
        const m = REFERENCE.exec(key);
        if (!m || !site.collections[m[1]!]) continue;
        if (key === keyOf(page)) problems.push(`${where(page)}: its ${field} names itself.`);
        else if (!findByKey(entries, key)) problems.push(`${where(page)}: its ${field} ${key} names no page.`);
      }
    }
  }
  return problems;
}

/** Every title can be linked (remark-wiki-link cannot parse `[`, `]` or `|` inside [[…]]) and is unique across both sites, drafts included. */
function checkTitles({ entries, other }: Context): string[] {
  const problems: string[] = [];
  for (const page of entries)
    if (/[[\]|]/.test(page.title))
      problems.push(`${where(page)}: its title "${page.title}" has [, ] or |, so [[wiki links]] cannot name it.`);
  const seen = new Map<string, string[]>();
  for (const e of other.entries) seen.set(normaliseTitle(e.title), [`${other.url}${e.url}`]);
  for (const page of entries) {
    const key = normaliseTitle(page.title);
    if (!key) continue;
    seen.set(key, [...(seen.get(key) ?? []), where(page)]);
  }
  for (const [title, at] of seen)
    if (at.length > 1)
      problems.push(`"${title}" is the title of ${at.length} pages (${at.join(', ')}): give each its own.`);
  return problems;
}

export function check(input: CheckInput): string[] {
  const { root, site, raws, other } = input;
  const dir = typeof root === 'string' ? root : fileURLToPath(root);
  const entries = raws.map((raw) => toSiteEntry(raw, site));
  const live = published(entries);
  const urls = new Set(live.map((p) => p.url));
  const inPublic = (file: string) =>
    fs.existsSync(path.join(dir, 'public', decodeURIComponent(file.split(/[?#]/)[0]!)));
  // public/'s folders (/media/, /images/…): a link into one names a file, not a page.
  const publicDirs = fs.existsSync(path.join(dir, 'public'))
    ? fs
        .readdirSync(path.join(dir, 'public'), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => `/${d.name}/`)
    : [];
  const routes = new RegExp(
    `^/(${[
      ...Object.entries(site.collections).flatMap(([c, config]) =>
        Object.keys(config.types ?? {}).map((t) => `${c}/type/${t}`),
      ),
      '([\\w-]+/)?feed\\.xml',
      'sitemap-index\\.xml',
      'robots\\.txt',
      'graph\\.json',
      'llms\\.txt',
    ].join('|')})$`,
  );
  const context: Context = {
    ...input,
    entries,
    live,
    index: linkIndex(live, other.entries, other.url, other.folder),
    urls,
    pathProblem: (p) => {
      if (publicDirs.some((d) => p.startsWith(d))) return inPublic(p) ? null : `${p} is missing from public/.`;
      return routes.test(p) || urls.has(pathOf(p)) ? null : `${p} is not a page.`;
    },
  };
  return [checkIds, checkNavigation, checkRedirects, checkLinks, checkReferences, checkTitles].flatMap((rule) =>
    rule(context),
  );
}
