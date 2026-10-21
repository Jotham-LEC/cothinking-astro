// `npm run check`: the content rules the Laravel app's `wiki:check` enforced,
// on the files in src/content. Every published page: its [[wiki links]] name
// a published page, its /media links exist, its ](/path) links are pages or
// routes, its image exists, no "Sample:" page is left; every page (drafts too)
// has the front matter its collection needs; titles are unique across both
// sites. Then src/data/titles.json is rebuilt for the Markdown pipeline.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProject, type Project } from './files.ts';
import { published } from './pages.ts';
import { normaliseTitle, resolveTitle, titleIndex } from './titles.ts';
import { pathOf } from './urls.ts';
import { localTargets, wikiLinksIn } from './links.ts';
import type { Page } from './types.ts';

const ROUTES = /^\/(notes\/type\/[a-z]+|([\w-]+\/)?feed\.xml|sitemap\.xml|robots\.txt|graph\.json|llms\.txt)$/;
const BASE_KEYS = ['title', 'description', 'image', 'updated', 'draft', 'seo'];
const KEYS: Record<string, string[]> = {
  pages: ['template', 'order', 'parent'],
  essays: ['date', 'reshare'],
  notes: ['date', 'type', 'quote', 'cite', 'photos', 'link_url', 'link_title', 'link_image', 'video_url'],
  projects: ['date'],
  publications: ['date', 'outlet'],
  wiki: ['date', 'author', 'category', 'related_pages', 'series', 'part', 'reshare'],
  problems: ['order', 'parent', 'what_i_do', 'case_study', 'case_study_line'],
  work: [
    'order',
    'parent',
    'website',
    'year',
    'kind',
    'quote',
    'quote_by',
    'quote_role',
    'stats',
    'steps',
    'eyebrow',
    'context',
    'closing',
    'content',
  ],
  cothinking_pages: ['template', 'order', 'parent', 'related_wiki'],
};

export function check(project: Project): string[] {
  const { pages, collections, root, titles: imported } = project;
  const problems: string[] = [];
  const live = published(pages);
  const urls = new Set(live.map((p) => p.url!));
  const titles = titleIndex(live, imported);
  const where = (p: Page) => p.url ?? `${p.collection}/${p.slug}`;
  const inPublic = (file: string) =>
    fs.existsSync(path.join(root, 'public', decodeURIComponent(file.split(/[?#]/)[0]!)));

  for (const page of live) {
    const body = page.body + ' ' + (typeof page.data.quote === 'string' ? page.data.quote : '');
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
    if (!c) {
      problems.push(`${where(page)}: no collection ${page.collection}.`);
      continue;
    }
    if (!page.title.trim()) problems.push(`${where(page)}: title is required.`);
    if (c.dated && !page.date) problems.push(`${where(page)}: a ${page.collection} entry needs a date.`);
    if (c.types && page.type && !c.types.some((t) => t.handle === page.type))
      problems.push(`${where(page)}: type ${page.type} is not one of ${c.types.map((t) => t.handle).join(', ')}.`);
    for (const [field, options] of Object.entries(c.options ?? {})) {
      const value = page.data[field];
      if (value !== undefined && !(typeof value === 'string' && value in options))
        problems.push(
          `${where(page)}: ${field}: ${String(value)} is not one of its options (${Object.keys(options).join(', ')}).`,
        );
    }
    const allowed = new Set([...BASE_KEYS, ...(KEYS[page.collection] ?? [])]);
    for (const key of Object.keys(page.data))
      if (!allowed.has(key)) problems.push(`${where(page)}: \`${key}\` is not a field of ${page.collection}.`);
    if ((c.root || c.orderable) && page.order === null) problems.push(`${where(page)}: not in its tree (no order).`);
    if (typeof page.data.reshare === 'string' && page.data.reshare === `${page.collection}/${page.slug}`)
      problems.push(`${where(page)}: reshares itself.`);
  }

  // Two pages with one title (a draft included, and the other site's pages).
  const seen = new Map<string, string[]>();
  for (const [title, url] of Object.entries(imported)) if (/^https?:\/\//.test(url)) seen.set(title, [url]);
  for (const page of pages) {
    const key = normaliseTitle(page.title);
    if (!key) continue;
    seen.set(key, [...(seen.get(key) ?? []), where(page)]);
  }
  for (const [title, at] of seen)
    if (at.length > 1)
      problems.push(`"${title}" is the title of ${at.length} pages (${at.join(', ')}): give each its own.`);

  return problems;
}

export function writeTitles(project: Project): void {
  const titles = titleIndex(published(project.pages), project.titles);
  fs.writeFileSync(path.join(project.root, 'src/data/titles.json'), JSON.stringify(titles, null, 2) + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const project = loadProject(root);
  const problems = check(project);
  writeTitles(project);
  if (problems.length === 0) {
    console.log(`${published(project.pages).length} pages checked: no problems.`);
  } else {
    for (const p of problems) console.error(p);
    process.exit(1);
  }
}
