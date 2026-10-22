#!/usr/bin/env node
// Captures the golden set from the local Laravel app (`php artisan serve
// --port=8004`, APP_ENV=production so robots and llms match production): every
// URL in DEV_FILES/manifest.json plus the listings, feeds and generated files.
// GOLDEN_BASE is the site's local address (cothink.ing: http://cothinking.localhost:8004).
// Saved under DEV_FILES/golden/pages/ for scripts/compare.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProject } from '../src/lib/files.ts';
import { noteTypes } from '../src/lib/noteTypes.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.GOLDEN_BASE ?? 'http://localhost:8004';
const OUT = path.join(ROOT, 'DEV_FILES/golden/pages');

// Addresses with no entry behind them: the section listings by post type, the
// feeds and the generated files, from this project's site and collections.
const project = loadProject(ROOT);
export const EXTRA_URLS = [
  ...Object.entries(project.collections)
    .filter(([, c]) => c.types && c.mount)
    .flatMap(([handle, c]) => {
      const landing = project.pages.find((p) => p.collection === c.mount.collection && p.slug === c.mount.slug);
      return landing?.url
        ? [
            landing.url,
            ...noteTypes(project.pages, project.collections, handle).map((t) => `${landing.url}/type/${t.handle}`),
          ]
        : [];
    }),
  '/feed.xml',
  ...project.site.feeds.map((section) => `/${section}/feed.xml`),
  '/graph.json',
  '/llms.txt',
  '/robots.txt',
  '/sitemap.xml',
  '/no-such-page',
];

export function fileFor(url) {
  const clean = url === '/' ? '/index' : url.replace(/\/$/, '');
  return /\.[a-z]+$/.test(clean) ? clean : `${clean}.html`;
}

// Only when run as a script: compare.mjs imports EXTRA_URLS and fileFor from here.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'DEV_FILES/manifest.json'), 'utf8'));
  const urls = [...manifest.map((p) => p.url), ...EXTRA_URLS];
  fs.rmSync(OUT, { recursive: true, force: true });

  let n = 0;
  for (const url of urls) {
    const res = await fetch(BASE + url, { redirect: 'manual' });
    const body = await res.text();
    const file = path.join(OUT, fileFor(url));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
    if (res.status !== 200 && url !== '/no-such-page') console.warn(`${res.status} ${url}`);
    n += 1;
  }
  console.log(`Saved ${n} responses from ${BASE} to ${OUT}`);
}
