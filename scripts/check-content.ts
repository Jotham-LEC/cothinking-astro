// `npm run check:content` (after `astro sync`, which validates every file's
// front matter against src/content.config.ts): the content rules the Laravel
// app's `wiki:check` enforced that a schema cannot see. Every published page:
// its [[wiki links]] name a published page, its /media links exist, its
// ](/path) links are pages or routes, its image exists, no "Sample:" page is
// left. Every page (drafts too): a page of a tree is in it; its title can be
// linked (no `[`, `]` or `|`) and is unique across both sites.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProject, type Project } from '../src/lib/files.ts';
import { localTargets, wikiLinksIn } from '../src/lib/links.ts';
import { published } from '../src/lib/pages.ts';
import { normaliseTitle, resolveTitle } from '../src/lib/titles.ts';
import type { Page } from '../src/lib/types.ts';
import { pathOf } from '../src/lib/urls.ts';

// The endpoints a body may link to, beside the pages.
const ROUTES = /^\/(notes\/type\/[a-z]+|([\w-]+\/)?feed\.xml|sitemap-index\.xml|robots\.txt|graph\.json|llms\.txt)$/;

export function check(project: Project): string[] {
  const { pages, collections, root, titles, otherSiteTitles } = project;
  const problems: string[] = [];
  const live = published(pages);
  const urls = new Set(live.map((p) => p.url));
  const where = (p: Page) => p.url ?? `${p.collection}/${p.slug}`;
  const inPublic = (file: string) =>
    fs.existsSync(path.join(root, 'public', decodeURIComponent(file.split(/[?#]/)[0]!)));

  for (const page of live) {
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
  }

  // Two pages with one title (a draft included, and the other site's pages).
  const seen = new Map<string, string[]>();
  for (const [title, url] of Object.entries(otherSiteTitles)) seen.set(title, [url]);
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const project = loadProject(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const problems = check(project);
  if (problems.length === 0) {
    console.log(`${published(project.pages).length} pages checked: no problems.`);
  } else {
    for (const p of problems) console.error(p);
    process.exit(1);
  }
}
