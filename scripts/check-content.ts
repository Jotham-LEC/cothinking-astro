// `npm run check -w sites/<site>` (after `astro sync`, which validates every file's
// front matter against src/content.config.ts): the content rules the Laravel
// app's `wiki:check` enforced that a schema cannot see. Every published page:
// its [[wiki links]] name a published page, its /media links exist, its
// ](/path) links are pages or routes, its image exists, no "Sample:" page is
// left (a piece reshared from the other site too). Every page (drafts too):
// a page of a tree is in it; its references (reshare, related pages…) and
// authors exist; a reshared piece has its address there; its title can be
// linked (no `[`, `]` or `|`) and is unique across both sites.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProject, type Project } from '../packages/garden/lib/files.ts';
import { localTargets, wikiLinksIn } from '../packages/garden/lib/links.ts';
import { pageByKey, published } from '../packages/garden/lib/pages.ts';
import { normaliseTitle, resolveTitle } from '../packages/garden/lib/titles.ts';
import type { Page } from '../packages/garden/lib/types.ts';
import { pathOf } from '../packages/garden/lib/urls.ts';

// The endpoints a body may link to, beside the pages.
const ROUTES = /^\/(notes\/type\/[a-z]+|([\w-]+\/)?feed\.xml|sitemap-index\.xml|robots\.txt|graph\.json|llms\.txt)$/;

// Fields that name another entry as `collection/slug` (the import's references).
const REFERENCES = ['reshare', 'case_study', 'related_pages', 'related_wiki'];

export function check(project: Project): string[] {
  const { pages, collections, root, titles, otherSiteTitles, authors } = project;
  const problems: string[] = [];
  const live = published(pages);
  const urls = new Set(live.map((p) => p.url));
  const where = (p: Page) => p.url ?? `${p.collection}/${p.slug}`;
  const inPublic = (file: string) =>
    fs.existsSync(path.join(root, 'public', decodeURIComponent(file.split(/[?#]/)[0]!)));

  // A piece reshared from the other site (an `origin` collection's) is checked like a page: its text shows here.
  const reshared = pages.filter((p) => collections[p.collection]?.origin && !p.draft);
  for (const page of [...live, ...reshared]) {
    const body = page.body + '\n\n' + (typeof page.data.quote === 'string' ? page.data.quote : '');
    for (const title of wikiLinksIn(body)) {
      if (!resolveTitle(titles, title)) problems.push(`${where(page)}: [[${title}]] names no published page.`);
    }
    for (const target of localTargets(body)) {
      const p = decodeURIComponent(target.split(/[?#]/)[0]!);
      if (p.startsWith('/media/') || p.startsWith('/resume/') || p.startsWith('/images/')) {
        if (!inPublic(p)) problems.push(`${where(page)}: ${p} is missing from public/.`);
      } else if (!ROUTES.test(p) && !urls.has(pathOf(p))) {
        problems.push(`${where(page)}: ${p} is not a page.`);
      }
    }
    if (page.image && !inPublic(page.image))
      problems.push(`${where(page)}: its image ${page.image} is missing from public/.`);
    if (page.title.startsWith('Sample:')) problems.push(`${where(page)}: a sample page is still here.`);
  }

  for (const page of pages) {
    const c = collections[page.collection];
    if (c && (c.root || c.orderable) && page.order === null)
      problems.push(`${where(page)}: not in its tree (no order).`);
    // remark-wiki-link cannot parse these inside [[…]], so such a page could never be linked.
    if (/[[\]|]/.test(page.title))
      problems.push(`${where(page)}: its title "${page.title}" has [, ] or |, so [[wiki links]] cannot name it.`);
    for (const field of REFERENCES)
      for (const key of [page.data[field]].flat().filter((k) => k !== undefined)) {
        if (key === `${page.collection}/${page.slug}`) problems.push(`${where(page)}: its ${field} names itself.`);
        else if (typeof key !== 'string' || !pageByKey(pages, key))
          problems.push(`${where(page)}: its ${field} ${String(key)} names no page.`);
      }
    for (const author of [page.data.author].flat().filter((a) => a !== undefined))
      if (!authors.some((a) => a.id === author))
        problems.push(`${where(page)}: its author ${String(author)} is not in src/data/authors.yaml.`);
    if (c?.origin && !(typeof page.data.url === 'string' && page.data.url.startsWith(c.origin)))
      problems.push(`${where(page)}: a reshared piece needs its address on ${c.origin} (\`url\`).`);
  }

  // Two pages with one title (a draft included, and the other site's pages).
  const seen = new Map<string, string[]>();
  for (const [title, url] of Object.entries(otherSiteTitles)) seen.set(title, [url]);
  for (const page of pages) {
    // A reshared piece is the other site's page, already in its titles by its address.
    if (collections[page.collection]?.origin) continue;
    const key = normaliseTitle(page.title);
    if (!key) continue;
    seen.set(key, [...(seen.get(key) ?? []), where(page)]);
  }
  for (const [title, at] of seen)
    if (at.length > 1)
      problems.push(`"${title}" is the title of ${at.length} pages (${at.join(', ')}): give each its own.`);

  return problems;
}

// Run from a site's folder (`npm run check -w sites/<site>`): the site is the working folder.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const project = loadProject(process.cwd());
  const problems = check(project);
  if (problems.length === 0) {
    console.log(`${published(project.pages).length} pages checked: no problems.`);
  } else {
    for (const p of problems) console.error(p);
    process.exit(1);
  }
}
