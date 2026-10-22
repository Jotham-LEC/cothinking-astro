#!/usr/bin/env node
// `node scripts/snapshot.mjs <site> <out.json>`: what a built site says, page by
// page, so a refactor can be checked against the build before it
// (scripts/diff-snapshot.mjs). Reads sites/<site>/dist: for each HTML page its
// head (title, description, canonical, robots, og:type, og:image, the JSON-LD
// node types), headings (level, id, text), internal links, and where a
// redirect page sends you; robots.txt and llms.txt whole; the feeds' items;
// the sitemap's addresses; the graph's nodes and links.
import fs from 'node:fs';
import path from 'node:path';

const [site, out] = process.argv.slice(2);
if (!site || !out) {
  console.error('Usage: node scripts/snapshot.mjs <site> <out.json>');
  process.exit(2);
}
const dist = path.resolve('sites', site, 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error(`${dist} has no build: run \`npm run build -w sites/${site}\` first.`);
  process.exit(2);
}

const files = fs.readdirSync(dist, { recursive: true, encoding: 'utf8' }).sort();
const read = (file) => fs.readFileSync(path.join(dist, file), 'utf8');

const decode = (text) =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const text = (html) =>
  decode(html.replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return m ? decode(m[1]) : null;
};
const meta = (html, key, value) => {
  const re = new RegExp(`<meta\\s+${key}="${value}"\\s+content="([^"]*)"`);
  const m = re.exec(html);
  return m ? decode(m[1]) : null;
};

function page(html) {
  const redirect = /<meta http-equiv="refresh" content="0;url=([^"]*)">/.exec(html);
  if (redirect) return { redirectTo: decode(redirect[1]) };
  const title = /<title>([^<]*)<\/title>/.exec(html);
  const canonical = /<link rel="canonical" href="([^"]*)">/.exec(html);
  const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  let jsonLdTypes = [];
  if (ld) {
    try {
      const graph = JSON.parse(ld[1])['@graph'] ?? [];
      jsonLdTypes = graph.map((n) => n['@type']);
    } catch {
      jsonLdTypes = ['(invalid JSON-LD)'];
    }
  }
  const main = html.slice(html.indexOf('<main'), html.lastIndexOf('</main>'));
  const headings = [...main.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/g)].map((m) => ({
    level: Number(m[1]),
    id: attr(m[2], 'id'),
    text: text(m[3]),
  }));
  const internalLinks = [...new Set([...main.matchAll(/<a\s[^>]*href="(\/[^"]*)"/g)].map((m) => decode(m[1])))].sort();
  return {
    title: title ? decode(title[1]) : null,
    description: meta(html, 'name', 'description'),
    canonical: canonical ? decode(canonical[1]) : null,
    robots: meta(html, 'name', 'robots'),
    ogType: meta(html, 'property', 'og:type'),
    ogImage: meta(html, 'property', 'og:image'),
    jsonLdTypes,
    headings,
    internalLinks,
  };
}

function feed(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const item = m[1];
    const field = (name) => {
      const r = new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${name}>`).exec(item);
      return r ? r[1] : null;
    };
    return { title: field('title'), link: field('link'), pubDate: field('pubDate'), description: field('description') };
  });
}

const pages = {};
const feeds = {};
for (const file of files) {
  if (file.endsWith('.html')) {
    const url = '/' + file.replace(/index\.html$/, '').replace(/\.html$/, '');
    pages[url === '/' ? '/' : url.replace(/\/$/, '')] = page(read(file));
  } else if (file.endsWith('feed.xml')) {
    feeds['/' + file] = feed(read(file));
  }
}
const sitemap = fs.existsSync(path.join(dist, 'sitemap-0.xml'))
  ? [...read('sitemap-0.xml').matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]).sort()
  : [];
const graph = fs.existsSync(path.join(dist, 'graph.json')) ? JSON.parse(read('graph.json')) : null;

const snapshot = {
  site,
  pages,
  feeds,
  sitemap,
  graph,
  robots: fs.existsSync(path.join(dist, 'robots.txt')) ? read('robots.txt') : null,
  llms: fs.existsSync(path.join(dist, 'llms.txt')) ? read('llms.txt') : null,
  files: files.filter((f) => !f.startsWith('_astro/') && !f.startsWith('pagefind/')).sort(),
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(snapshot, null, 1) + '\n');
console.log(`${Object.keys(pages).length} pages, ${Object.keys(feeds).length} feeds → ${out}`);
