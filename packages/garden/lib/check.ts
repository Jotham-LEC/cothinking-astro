// The content rules a schema cannot see (`npm test`, tests/sites.test.ts,
// over both sites' folders). File names are ids: lower-case letters, digits
// and dashes. Every collection folder is in the site config, and each
// section's landing page exists. Every published page: its [[wiki links]]
// name a published page, its /media links exist, its ](/path) links are
// pages or routes, its image exists, no "Sample:" page is left. Every page
// (drafts too): an ordered collection's page has its `order`; a field that
// names another entry (`collection/id`) names one that exists; its author
// is known; its title can be linked (no `[`, `]` or `|`) and is unique
// across both sites.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { byKey, keyOf, published, toSiteEntry, type RawEntry, type SiteEntry, type UrlOf } from './entry.ts';
import { localTargets, wikiLinksIn } from './links.ts';
import { pathOf, type SiteConfig } from './site.ts';
import { normaliseTitle, resolveTitle, titleIndex } from './titles.ts';

const ID = /^[a-z0-9-]+$/;
const REFERENCE = /^([a-z_]+)\/([a-z0-9-]+)$/;

export type CheckInput = {
  root: URL | string;
  site: SiteConfig;
  urlOf: UrlOf;
  raws: RawEntry[];
  /** The other site's published entries and address, for the title index and the uniqueness of titles. */
  other: { entries: SiteEntry[]; url: string };
};

export function check({ root, site, urlOf, raws, other }: CheckInput): string[] {
  const dir = typeof root === 'string' ? root : fileURLToPath(root);
  const problems: string[] = [];
  const entries = raws.map((raw) => toSiteEntry(raw, urlOf));
  const live = published(entries);
  const titles = titleIndex(live, other.entries, other.url);
  const urls = new Set(live.map((p) => p.url));
  const where = (p: SiteEntry) => p.url;
  const inPublic = (file: string) =>
    fs.existsSync(path.join(dir, 'public', decodeURIComponent(file.split(/[?#]/)[0]!)));
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

  for (const collection of new Set(raws.map((r) => r.collection)))
    if (!site.collections[collection]) problems.push(`src/content/${collection}: not in site.config.ts.`);
  for (const [collection, config] of Object.entries(site.collections))
    if (config.landing && !byKey(entries, `pages/${config.landing}`))
      problems.push(`${collection}: its landing page pages/${config.landing} does not exist.`);
  for (const raw of raws)
    if (!ID.test(raw.id)) problems.push(`src/content/${raw.collection}/${raw.id}.md: name it with [a-z0-9-] only.`);

  for (const page of live) {
    const body = page.body + '\n\n' + (page.quote ?? '');
    for (const title of wikiLinksIn(body)) {
      if (!resolveTitle(titles, title)) problems.push(`${where(page)}: [[${title}]] names no published page.`);
    }
    for (const target of localTargets(body)) {
      const p = decodeURIComponent(target.split(/[?#]/)[0]!);
      if (p.startsWith('/media/') || p.startsWith('/resume/') || p.startsWith('/images/')) {
        if (!inPublic(p)) problems.push(`${where(page)}: ${p} is missing from public/.`);
      } else if (!routes.test(p) && !urls.has(pathOf(p))) {
        problems.push(`${where(page)}: ${p} is not a page.`);
      }
    }
    if (page.image && !inPublic(page.image))
      problems.push(`${where(page)}: its image ${page.image} is missing from public/.`);
    if (page.title.startsWith('Sample:')) problems.push(`${where(page)}: a sample page is still here.`);
  }

  for (const raw of raws) {
    const page = entries.find((e) => keyOf(e) === keyOf(raw))!;
    if (site.collections[page.collection]?.order === 'order' && page.order === null)
      problems.push(`${where(page)}: no order, in an ordered collection.`);
    // remark-wiki-link cannot parse these inside [[…]], so such a page could never be linked.
    if (/[[\]|]/.test(page.title))
      problems.push(`${where(page)}: its title "${page.title}" has [, ] or |, so [[wiki links]] cannot name it.`);
    for (const [field, value] of Object.entries(raw.data)) {
      for (const key of [value].flat()) {
        if (typeof key !== 'string') continue;
        const m = REFERENCE.exec(key);
        if (!m || !site.collections[m[1]!]) continue;
        if (key === keyOf(page)) problems.push(`${where(page)}: its ${field} names itself.`);
        else if (!byKey(entries, key)) problems.push(`${where(page)}: its ${field} ${key} names no page.`);
      }
    }
    if (page.author && !site.authors[page.author])
      problems.push(`${where(page)}: its author ${page.author} is not in site.config.ts.`);
  }

  // Two pages with one title (a draft included, and the other site's pages).
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
