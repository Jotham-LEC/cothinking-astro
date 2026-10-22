#!/usr/bin/env node
// Migration only: delete once the Astro repo is the source.
//
// Compares the golden set (DEV_FILES/$SITE/golden/pages, from the Laravel app) with
// the build (dist/), page by page: head tags, JSON-LD, h1, eyebrow, status
// line, heading ids, wiki links, callouts, images, breadcrumbs, Explorer rows,
// "Linked from", pager, archive rows, outline; feeds, graph (by url), llms,
// robots and sitemap normalised. Expected differences (listed in EXPECTED
// below) are normalised away before comparing.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'node-html-parser';
import YAML from 'yaml';
import { EXTRA_URLS, fileFor } from './golden.mjs';
import { DEV, ROOT } from './site.mjs';

const GOLDEN = path.join(DEV, 'golden/pages');
const DIST = path.join(ROOT, 'dist');
// This project's address; the golden pages print both sites' local hosts, mapped back below.
const SITE = YAML.parse(fs.readFileSync(path.join(ROOT, 'src/data/site.yaml'), 'utf8')).url;
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const verbose = process.argv.includes('--verbose');

// Expected differences, by design (see DEV_FILES/specs/astro-rebuild.md):
//  - pagination paths: `?page=2` → `/2`
//  - og:image and the generated card (phase 6), Glide crops → not compared
//  - Vite asset names: not compared
//  - /search.json → Pagefind: not compared
//  - GFM autolinks bare URLs: body links other than wiki links are not compared
//  - 404 suggestions come from Pagefind in the browser: not compared; its og:url is the address asked for, which a static page cannot know
//  - feeds are @astrojs/rss's: item bodies escaped rather than in CDATA, pubDate as `GMT` rather than `+0000`; the
//    Laravel feed view also indented the CDATA, wrote `<img />` and escaped quotes and ampersands as &quot;/&amp; where rehype writes
//    &#x26;. Decoded, the HTML and the dates are the same
//  - the sitemap is @astrojs/sitemap's: /sitemap-index.xml + /sitemap-0.xml instead of /sitemap.xml, and robots.txt names the index
//  - Explorer rows for note types and years: Laravel printed absolute addresses, Astro prints paths
//  - images Glide resized (/img/asset/…) are astro:assets' (/_astro/…): compared by file name, size and attributes
//  - GFM task lists: remark-gfm adds the contains-task-list and task-list-item classes and writes
//    `<input type="checkbox" disabled>` where Laravel wrote `<input disabled="" type="checkbox">`; the same list
//  - the golden's own-site links: a link to this site's production address was external on the local Laravel
//    site, as was the host of a piece it reshares ("Originally published at localhost"); not counted
//  - an Article's author Person: the golden's sites are local addresses, so the Laravel app could not match the
//    author's production URL to a site and left out its `@id` (the site's Person); the build has it
const EXPECTED = {
  skipMeta: /^(og:image|og:image:width|og:image:height|og:image:alt|twitter:image)$/,
  skipJsonLdKeys: ['image', 'primaryImageOfPage', 'thumbnailUrl'],
};

const normaliseHost = (s) =>
  s
    .replace(/http:\/\/cothinking\.localhost:8004/g, 'https://cothink.ing')
    .replace(/http:\/\/localhost:8004/g, 'https://jothamlim.com')
    .replace(/\?page=(\d+)/g, '/$1');
// A resized image by its file's name: Glide's /img/asset/{base64}/{name}?… and astro:assets' /_astro/{name}.{hash}.
const imageName = (src) =>
  src
    ?.replace(/^\/img\/asset\/[^/]+\/([^?]+)\?.*$/, 'resized $1')
    .replace(/^\/_astro\/([^.]+)\.[\w-]+?(?:_[\w-]+)?\.(\w+)$/, 'resized $1.$2');
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);

function extract(html) {
  const root = parse(normaliseHost(html));
  const head = root.querySelector('head');
  const main = root.querySelector('main') ?? root;
  const metas = {};
  for (const m of head?.querySelectorAll('meta[property], meta[name]') ?? []) {
    const key = m.getAttribute('property') ?? m.getAttribute('name');
    if (['viewport'].includes(key) || EXPECTED.skipMeta.test(key)) continue;
    metas[key] = m.getAttribute('content');
  }
  const jsonld = [];
  for (const s of head?.querySelectorAll('script[type="application/ld+json"]') ?? []) {
    try {
      const data = JSON.parse(s.textContent);
      const strip = (node, key) => {
        if (Array.isArray(node)) return node.map((n) => strip(n, key));
        if (node && typeof node === 'object' && key === 'author' && node['@type'] === 'Person') {
          const { '@id': _, ...rest } = node;
          node = rest;
        }
        if (node && typeof node === 'object')
          return Object.fromEntries(
            Object.entries(node)
              .filter(([k]) => !EXPECTED.skipJsonLdKeys.includes(k))
              .map(([k, v]) => [k, strip(v, k)]),
          );
        return node;
      };
      jsonld.push(strip(data));
    } catch {
      jsonld.push('invalid json');
    }
  }
  const article = main.querySelector('article') ?? main;
  return {
    title: text(head?.querySelector('title')),
    canonical: head?.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    alternates: (head?.querySelectorAll('link[rel="alternate"]') ?? []).map(
      (l) => `${l.getAttribute('title')} ${l.getAttribute('href')}`,
    ),
    prevNext: (head?.querySelectorAll('link[rel="prev"], link[rel="next"]') ?? []).map(
      (l) => `${l.getAttribute('rel')} ${l.getAttribute('href')}`,
    ),
    metas,
    jsonld,
    // Third-party tags: external scripts, tag ids in inline scripts (GTM's loader), <noscript> iframes.
    tags: [
      ...(head?.querySelectorAll('script[src^="http"]') ?? []).map((s) => `script ${s.getAttribute('src')}`),
      ...root
        .querySelectorAll('script:not([src])')
        .flatMap((s) => [...s.textContent.matchAll(/\bGTM-[A-Z0-9]+\b/g)].map((m) => `tag ${m[0]}`)),
      ...[...html.matchAll(/<noscript>\s*<iframe[^>]*\bsrc="([^"]+)"/g)].map((m) => `noscript ${m[1]}`),
    ],
    h1: text(main.querySelector('h1')),
    eyebrow: text(main.querySelector('header p.text-accent')),
    source: text(main.querySelector('header p.text-muted'))?.replace(/ at localhost,/, ' at jothamlim.com,') ?? null,
    statusline: text(root.querySelector('[data-status-scroll]')?.previousElementSibling),
    headings: article
      .querySelectorAll('h2[id], h3[id], h4[id]')
      .map((h) => `${h.tagName.toLowerCase()}#${h.id} ${text(h)}`),
    wikiLinks: article
      .querySelectorAll('a.wiki-link')
      .map((a) => `${a.getAttribute('href')} ${a.classList.contains('external-link') ? '(external)' : ''} ${text(a)}`),
    missing: article.querySelectorAll('.wiki-link-missing').map((s) => s.getAttribute('data-title')),
    externalLinks: article.querySelectorAll('a.external-link').filter((a) => a.getAttribute('href') !== SITE).length,
    callouts: article
      .querySelectorAll('.callout')
      .map((c) => `${c.getAttribute('class')} | ${text(c.querySelector('.callout-title'))}`),
    images: article
      .querySelectorAll('img')
      .map(
        (i) =>
          `${imageName(i.getAttribute('src'))} ${i.getAttribute('width')}x${i.getAttribute('height')} ${i.getAttribute('loading')} ${i.getAttribute('fetchpriority') ?? ''} ${(i.getAttribute('class') ?? '').includes('zoomable') ? 'zoomable' : ''} fig:${i.parentNode?.tagName === 'FIGURE' ? text(i.parentNode.querySelector('figcaption')) : '-'}`,
      ),
    figures: article.querySelectorAll('figure.figure figcaption').map(text),
    breadcrumbs: text(main.querySelector('nav[aria-label="Breadcrumb"]')),
    explorer: root
      .querySelectorAll('[data-explorer] li[data-path]')
      .map(
        (li) =>
          `${li.getAttribute('data-path').replace(SITE, '')}${li.classList.contains('is-collapsed') ? ' (closed)' : ''}${li.querySelector(':scope > div [aria-current]') ? ' (current)' : ''}`,
      ),
    explorerTitles: root.querySelectorAll('[data-explorer] li[data-path] > div').map(text),
    menu: root.querySelectorAll('[data-drawer-menu] a').map((a) => `${a.getAttribute('href')} ${text(a)}`),
    headerNav: root.querySelectorAll('nav[aria-label="Header"] a').map((a) => `${a.getAttribute('href')} ${text(a)}`),
    linkedFrom: root.querySelectorAll('[data-backlinks] a').map((a) => `${a.getAttribute('href')} ${text(a)}`),
    toc: root.querySelectorAll('[data-rail] [data-toc] a').map((a) => `${a.getAttribute('href')} ${text(a)}`),
    tocMobile: main.querySelectorAll('details[data-toc] a').map((a) => `${a.getAttribute('href')} ${text(a)}`),
    pager: main
      .querySelectorAll('a[rel="prev"], a[rel="next"]')
      .map((a) => `${a.getAttribute('rel')} ${a.getAttribute('href')} ${text(a)}`),
    archive: main.querySelectorAll('[data-archive] li, .not-prose.list-none li').map(text),
    streamImages: main
      .querySelectorAll('[data-stream] img')
      .map((i) => `${i.getAttribute('src')} ${i.getAttribute('loading')} ${i.getAttribute('fetchpriority') ?? ''}`),
    streamCards: main
      .querySelectorAll('[data-stream] article')
      .map(
        (a) =>
          `${a.getAttribute('data-type')} ${a.getAttribute('aria-label')} ${text(a.querySelector('[data-month]'))}`,
      ),
    lastUpdated: text(main.querySelectorAll('p').find((p) => p.textContent.includes('Last updated'))),
    graph: root.querySelector('[data-graph]')?.getAttribute('data-graph') ?? null,
    palette: root
      .querySelectorAll('[data-palette-results] a')
      .map((a) => `${a.getAttribute('href')} ${a.getAttribute('data-label')}`),
    footer: text(root.querySelector('footer .text-center')),
    popovers: main.querySelectorAll('[data-popover]').length,
    body: root.querySelector('body')?.getAttribute('class')?.split(/\s+/).sort().join(' '),
    lang: root.querySelector('html')?.getAttribute('lang'),
  };
}

function feed(xml) {
  const src = normaliseHost(xml);
  // Laravel wrote item bodies in indented CDATA and @astrojs/rss escapes them; both
  // decode to the same HTML. Then the HTML's own entity and spacing styles are
  // evened out (Laravel escaped quotes and apostrophes; rehype writes &#x26;).
  const decode = (s) =>
    s
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_, c) =>
        c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      )
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  const field = (block, name) => {
    const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(block);
    if (!m) return null;
    const value = decode(m[1])
      .replace(/&#039;|&#x27;/gi, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#x26;/gi, '&amp;')
      .replace(/&#x3C;/gi, '&lt;')
      .replace(/&#x3E;|&gt;/gi, '>')
      .replace(/\s*\/>/g, '>')
      .replace(/ class="(contains-task-list|task-list-item)"/g, '')
      .replace(/<input type="checkbox" disabled>/g, '<input disabled="" type="checkbox">')
      .replace(/>\s+</g, '><')
      .replace(/\s+/g, ' ')
      .trim();
    return name === 'pubDate' && value ? new Date(value).toISOString() : value;
  };
  const channel = src.split('<item>')[0];
  return {
    title: field(channel, 'title'),
    link: field(channel, 'link'),
    description: field(channel, 'description'),
    self: /<atom:link href="([^"]*)"/.exec(channel)?.[1] ?? null,
    items: [...src.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
      title: field(item, 'title'),
      link: field(item, 'link'),
      guid: field(item, 'guid'),
      pubDate: field(item, 'pubDate'),
      description: field(item, 'description'),
    })),
  };
}

function graph(json) {
  const data = JSON.parse(normaliseHost(json));
  const byId = Object.fromEntries(data.nodes.map((n) => [n.id, n]));
  return {
    nodes: data.nodes.map((n) => `${n.url} | ${n.title} | ${n.section} | ${n.section_title}`).sort(),
    links: data.links.map((l) => `${byId[l.source]?.url} -> ${byId[l.target]?.url}`).sort(),
  };
}

function sitemap(xml) {
  const root = parse(normaliseHost(xml));
  return root
    .querySelectorAll('url')
    .map((u) => {
      const lastmod = text(u.querySelector('lastmod'));
      return `${text(u.querySelector('loc')).replace(/\/$/, '')} ${lastmod ? new Date(lastmod).toISOString() : ''}`;
    })
    .sort();
}

const asText = (s) => normaliseHost(s).replace('/sitemap-index.xml', '/sitemap.xml').replace(/\s+$/gm, '').trim();

function diff(a, b, prefix = '') {
  const out = [];
  if (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.some((x) => x && typeof x === 'object' && !Array.isArray(x))
  ) {
    a.forEach((x, i) => out.push(...diff(x, b[i], `${prefix}[${i}]`)));
  } else if (Array.isArray(a) || Array.isArray(b)) {
    const A = JSON.stringify(a),
      B = JSON.stringify(b);
    if (A !== B) {
      const sa = new Set((a ?? []).map((x) => JSON.stringify(x))),
        sb = new Set((b ?? []).map((x) => JSON.stringify(x)));
      const onlyGolden = [...sa].filter((x) => !sb.has(x)),
        onlyBuild = [...sb].filter((x) => !sa.has(x));
      if (onlyGolden.length || onlyBuild.length)
        out.push(
          `${prefix}: golden-only ${onlyGolden.slice(0, 6).join(' ; ')}${onlyGolden.length > 6 ? ` (+${onlyGolden.length - 6})` : ''} | build-only ${onlyBuild.slice(0, 6).join(' ; ')}${onlyBuild.length > 6 ? ` (+${onlyBuild.length - 6})` : ''}`,
        );
      else out.push(`${prefix}: same items, different order`);
    }
  } else if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
      out.push(...diff(a[key], b[key], prefix ? `${prefix}.${key}` : key));
  } else if (JSON.stringify(a) !== JSON.stringify(b)) {
    out.push(`${prefix}: golden ${JSON.stringify(a)} | build ${JSON.stringify(b)}`);
  }
  return out;
}

function textDiff(a, b) {
  const A = asText(a).split('\n'),
    B = asText(b).split('\n');
  const sa = new Set(A),
    sb = new Set(B);
  const out = [];
  A.forEach((line, i) => {
    if (!sb.has(line)) out.push(`golden line ${i + 1}: ${line}`);
  });
  B.forEach((line, i) => {
    if (!sa.has(line)) out.push(`build line ${i + 1}: ${line}`);
  });
  if (!out.length && A.join('\n') !== B.join('\n')) out.push('same lines, different order');
  return out;
}

const manifest = JSON.parse(fs.readFileSync(path.join(DEV, 'manifest.json'), 'utf8'));
const urls = [...manifest.map((p) => p.url), ...EXTRA_URLS].filter(
  (u) => !only.length || only.some((o) => u.startsWith(o)),
);
let pagesWithDiffs = 0,
  missingBuild = 0,
  totalDiffs = 0;
for (const url of urls) {
  const file = fileFor(url);
  const goldenFile = path.join(GOLDEN, file);
  const distFile = path.join(
    DIST,
    url === '/no-such-page' ? '/404.html' : url === '/sitemap.xml' ? '/sitemap-0.xml' : file,
  );
  if (!fs.existsSync(goldenFile)) {
    console.log(`${url}: no golden`);
    continue;
  }
  if (!fs.existsSync(distFile)) {
    console.log(`${url}: NOT BUILT`);
    missingBuild++;
    continue;
  }
  const g = fs.readFileSync(goldenFile, 'utf8'),
    d = fs.readFileSync(distFile, 'utf8');
  let differences;
  if (url.endsWith('feed.xml')) differences = diff(feed(g), feed(d));
  else if (url.endsWith('graph.json')) differences = diff(graph(g), graph(d));
  else if (url.endsWith('sitemap.xml')) differences = diff(sitemap(g), sitemap(d));
  else if (url.endsWith('.txt')) differences = textDiff(g, d);
  else {
    const a = extract(g),
      b = extract(d);
    if (url === '/no-such-page') {
      for (const k of ['explorer', 'h1', 'canonical', 'palette', 'statusline']) {
        delete a[k];
        delete b[k];
      }
      delete a.metas['og:url'];
      delete b.metas['og:url'];
    }
    differences = diff(a, b);
  }
  if (differences.length) {
    pagesWithDiffs++;
    totalDiffs += differences.length;
    console.log(`\n== ${url}`);
    for (const line of differences.slice(0, verbose ? 1000 : 25))
      console.log('  ' + line.slice(0, verbose ? 100000 : 700));
    if (!verbose && differences.length > 25) console.log(`  … ${differences.length - 25} more`);
  }
}
console.log(
  `\n${urls.length} urls compared: ${urls.length - pagesWithDiffs - missingBuild} identical, ${pagesWithDiffs} with differences (${totalDiffs} lines), ${missingBuild} not built.`,
);
