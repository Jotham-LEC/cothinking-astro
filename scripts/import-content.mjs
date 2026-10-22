#!/usr/bin/env node
// Migration only: delete once the Astro repo is the source (with golden.mjs,
// compare.mjs, dump-heading-ids.php and node-html-parser).
//
// Imports jothamlim.com's content from the Laravel/Statamic repo, re-runnably:
// entries → src/content/{collection}/{slug}.md (slugs instead of UUIDs, the
// date in front matter, trees folded into `order`), navigations, globals,
// redirects → src/data, both sites' titles → src/data/titles.json (the other
// site's for the [[wiki links]] that point there), and with --media the
// site's media folders → public/. Wipes src/content and src/data first.
// LARAVEL comes from the environment.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const LARAVEL = process.env.LARAVEL ?? path.join(os.homedir(), 'Projects/jothamlim.com-laravel');
const SITE = 'jothamlim';
const COPY_MEDIA = process.argv.includes('--media');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Values resources/sites.yaml leaves to config. The other site's name and
// address, for its titles' addresses and the Person's `worksFor`.
const SITE_DEFAULTS = {
  jothamlim: { name: 'Jotham Lim', url: 'https://jothamlim.com' },
  cothinking: { name: 'CoThinking', url: 'https://cothink.ing' },
};
// Sections with a feed of their own (config/site.php).
const FEEDS = ['essays', 'notes'];
// Collections whose pages are Open Graph articles with an Article node (config/marketing-toolkit.php).
const ARTICLES = ['essays', 'notes', 'projects', 'publications'];

// What in public/ is this site's (media folders and other files).
const PUBLIC_FILES = [
  'media/career',
  'media/diagrams',
  'media/essays',
  'media/notes',
  'media/projects',
  'media/publications',
  'media/the-edge',
  'media/profile-400.jpg',
  'favicon.ico',
  'favicon.svg',
  'resume',
  'images/esomar',
];

const readYaml = (file) => YAML.parse(fs.readFileSync(file, 'utf8')) ?? {};
const exists = (file) => fs.existsSync(file);
const writeYaml = (file, data) => write(file, YAML.stringify(data, { lineWidth: 0 }));
function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

// ---------------------------------------------------------------- sites ----
const sitesYaml = readYaml(path.join(LARAVEL, 'resources/sites.yaml'));
const sites = Object.fromEntries(
  Object.entries(sitesYaml).map(([handle, site]) => [
    handle,
    {
      handle,
      name: site.name?.includes('{{') ? SITE_DEFAULTS[handle].name : site.name,
      url: (site.url?.includes('{{') ? SITE_DEFAULTS[handle].url : site.url).replace(/\/$/, ''),
      locale: site.locale,
      lang: site.lang,
      attributes: site.attributes ?? {},
    },
  ]),
);
if (!sites[SITE]) throw new Error(`No site ${SITE} in resources/sites.yaml`);

// ---------------------------------------------------------- collections ----
const collectionsDir = path.join(LARAVEL, 'content/collections');
const collections = {};
for (const file of fs.readdirSync(collectionsDir).filter((f) => f.endsWith('.yaml'))) {
  const handle = path.basename(file, '.yaml');
  const c = readYaml(path.join(collectionsDir, file));
  collections[handle] = {
    handle,
    title: c.title ?? handle,
    sites: c.sites ?? ['default'],
    route: c.route ?? '/{slug}',
    mount: c.mount ?? null,
    dated: Boolean(c.date),
    root: Boolean(c.structure?.root),
    structured: Boolean(c.structure),
    template: c.template ?? null,
  };
}

// Blueprints: the note types (one blueprint each, in `order`) and select options.
function blueprintsOf(handle) {
  const dir = path.join(LARAVEL, 'resources/blueprints/collections', handle);
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => {
      const b = readYaml(path.join(dir, f));
      const fields = [];
      for (const tab of Object.values(b.tabs ?? {}))
        for (const section of tab.sections ?? [])
          for (const field of section.fields ?? []) if (field.handle) fields.push(field);
      return {
        handle: path.basename(f, '.yaml'),
        title: b.title ?? path.basename(f, '.yaml'),
        order: b.order ?? 0,
        fields,
      };
    })
    .sort((a, b) => a.order - b.order);
}

// ------------------------------------------------------------- entries ----
// Every entry of every collection on every site, keyed by id.
const entries = new Map();
for (const c of Object.values(collections)) {
  for (const site of c.sites) {
    const dir = path.join(collectionsDir, c.handle, site);
    if (!exists(dir)) continue;
    for (const file of fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .sort()) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, body } = splitFrontMatter(raw, file);
      const name = path.basename(file, '.md');
      let date = null;
      let slug = name;
      if (c.dated) {
        const m = /^(\d{4}-\d{2}-\d{2})(?:-(\d{2})(\d{2}))?\.(.+)$/.exec(name);
        if (!m) throw new Error(`Undated file name in dated collection: ${file}`);
        date = m[2] ? `${m[1]}T${m[2]}:${m[3]}:00Z` : m[1];
        slug = m[4];
      }
      entries.set(data.id, {
        id: data.id,
        collection: c.handle,
        site,
        slug,
        date,
        data,
        body,
        file,
        published: data.published !== false,
        url: null,
        order: null,
        parent: null,
      });
    }
  }
}

// Trees give structured collections their order, parents and (for a root
// tree) the home page.
for (const c of Object.values(collections).filter((c) => c.structured)) {
  for (const site of c.sites) {
    const file = path.join(LARAVEL, 'content/trees/collections', site, `${c.handle}.yaml`);
    if (!exists(file)) continue;
    let n = 0;
    const walk = (items, parent) => {
      for (const item of items ?? []) {
        const entry = entries.get(item.entry);
        if (entry) {
          entry.order = n;
          entry.parent = parent;
        }
        n += 1;
        walk(item.children, entry ?? parent);
      }
    };
    walk(readYaml(file).tree, null);
  }
}

// URLs from the collection's route, as Statamic resolves them.
function urlOf(entry, seen = new Set()) {
  if (entry.url !== null) return entry.url || null;
  if (seen.has(entry.id)) return null;
  seen.add(entry.id);
  const c = collections[entry.collection];
  let url;
  if (c.structured && entry.order === null) {
    url = ''; // not in its tree: no address
  } else if (c.root && entry.order === 0) {
    url = '/';
  } else {
    url = c.route;
    if (url.includes('{mount}')) {
      const mount = c.mount ? entries.get(c.mount) : null;
      const mountUrl = mount ? urlOf(mount, seen) : null;
      url = url.replace('{mount}', mountUrl ?? '');
    }
    if (url.includes('{parent_uri}')) {
      url = url.replace('{parent_uri}', entry.parent ? (urlOf(entry.parent, seen) ?? '') : '');
    }
    url = url.replace('{slug}', entry.slug);
    url = ('/' + url).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }
  entry.url = url;
  return url || null;
}
for (const entry of entries.values()) urlOf(entry);

const absolute = (entry) => sites[entry.site].url + (entry.url === '/' ? '' : entry.url);
const ref = (id) => {
  const e = entries.get(id);
  return e ? `${e.collection}/${e.slug}` : null;
};

// ------------------------------------------------------------- content ----
fs.rmSync(path.join(ROOT, 'src/content'), { recursive: true, force: true });
fs.rmSync(path.join(ROOT, 'src/data'), { recursive: true, force: true });

const report = { counts: {}, drafts: [], unresolved: [], noUrl: [] };
const manifest = [];
const siteEntries = [...entries.values()].filter((e) => e.site === SITE);

for (const entry of siteEntries) {
  const c = collections[entry.collection];
  const fm = {};
  const d = entry.data;
  fm.title = d.title;
  if (d.description) fm.description = d.description;
  if (entry.date) fm.date = entry.date;
  if (d.updated_at) fm.updated = typeof d.updated_at === 'string' ? d.updated_at : new Date(d.updated_at).toISOString();
  if (!entry.published) {
    fm.draft = true;
    report.drafts.push(entry.url ?? entry.slug);
  }
  if (d.image) fm.image = `/media/${d.image}`;
  if (d.template) fm.template = d.template;
  if (c.structured && entry.order !== null) fm.order = entry.order;
  if (entry.parent) fm.parent = entry.parent.slug;
  if (entry.collection === 'notes') fm.type = d.blueprint ?? 'text';
  // Every other field the entry carries (the schema rejects one it does not know).
  const skip = new Set([
    'id',
    'blueprint',
    'title',
    'description',
    'updated_at',
    'updated_by',
    'published',
    'image',
    'template',
    'seo',
    'date',
  ]);
  for (const [key, value] of Object.entries(d)) {
    if (skip.has(key)) continue;
    if (key === 'photos' && Array.isArray(value)) {
      fm.photos = value.map((p) => `/media/${p}`);
      continue;
    }
    fm[key] = value;
  }
  const seo = cleanSeo(d.seo);
  if (seo) fm.seo = seo;

  const out = path.join(ROOT, 'src/content', entry.collection, `${entry.slug}.md`);
  write(out, `---\n${YAML.stringify(fm, { lineWidth: 0 })}---\n${entry.body}`);
  report.counts[entry.collection] = (report.counts[entry.collection] ?? 0) + 1;
  if (entry.published && entry.url)
    manifest.push({ url: entry.url, collection: entry.collection, slug: entry.slug, title: d.title });
  if (entry.published && !entry.url) report.noUrl.push(`${entry.collection}/${entry.slug}`);
}

function cleanSeo(seo) {
  if (!seo || typeof seo !== 'object') return null;
  const out = {};
  for (const key of [
    'title',
    'description',
    'canonical',
    'og_type',
    'og_title',
    'og_description',
    'image',
    'max_snippet',
  ]) {
    if (seo[key] !== undefined && seo[key] !== null && seo[key] !== '')
      out[key] = key === 'image' ? `/media/${seo[key]}` : seo[key];
  }
  if (seo.noindex === true) out.noindex = true;
  if (seo.nofollow === true) out.nofollow = true;
  if (seo.sitemap === false) out.sitemap = false;
  if (seo.nosnippet === true) out.nosnippet = true;
  const jsonLd = seo.json_ld?.code ?? (typeof seo.json_ld === 'string' ? seo.json_ld : null);
  if (jsonLd) out.json_ld = jsonLd;
  return Object.keys(out).length ? out : null;
}

function splitFrontMatter(raw, file) {
  if (!raw.startsWith('---\n')) throw new Error(`No front matter in ${file}`);
  const end = raw.indexOf('\n---', 4);
  if (end === -1) throw new Error(`Unterminated front matter in ${file}`);
  const yamlText = raw.slice(4, end + 1);
  let body = raw.slice(end + 4);
  if (body.startsWith('\n')) body = body.slice(1);
  return { data: YAML.parse(yamlText) ?? {}, body };
}

// ------------------------------------------------- collections.yaml ----
const siteCollections = {};
for (const c of Object.values(collections).filter((c) => c.sites.includes(SITE))) {
  const mount = c.mount ? entries.get(c.mount) : null;
  const blueprints = blueprintsOf(c.handle);
  const entry = { title: c.title, route: c.route, dated: c.dated, root: c.root, orderable: c.structured && !c.root };
  if (mount) entry.mount = { collection: mount.collection, slug: mount.slug };
  if (c.template) entry.template = c.template;
  if (ARTICLES.includes(c.handle)) Object.assign(entry, { og_type: 'article', schema: 'Article' });
  if (blueprints.length > 1) entry.types = blueprints.map((b) => ({ handle: b.handle, title: b.title }));
  const options = {};
  for (const b of blueprints)
    for (const f of b.fields) {
      if (f.field?.type === 'select' && f.field.options && !Array.isArray(f.field.options))
        options[f.handle] = f.field.options;
    }
  if (Object.keys(options).length) entry.options = options;
  siteCollections[c.handle] = entry;
}
writeYaml(path.join(ROOT, 'src/data/collections.yaml'), siteCollections);

// -------------------------------------------------------- navigation ----
const navDir = path.join(LARAVEL, 'content/trees/navigation', SITE);
const navItem = (item) => {
  const out = {};
  if (item.title) out.title = item.title;
  if (item.entry) {
    const r = ref(item.entry);
    if (r) out.entry = r;
    else report.unresolved.push(`navigation: ${item.entry}`);
  }
  if (item.url) out.url = item.url;
  if (item.children?.length) out.children = item.children.map(navItem);
  return out;
};
// One file, a tree per navigation (Astro's file() loader reads a record of objects).
const navigation = {};
if (exists(navDir)) {
  for (const file of fs.readdirSync(navDir).filter((f) => f.endsWith('.yaml'))) {
    navigation[path.basename(file, '.yaml')] = { items: (readYaml(path.join(navDir, file)).tree ?? []).map(navItem) };
  }
}
writeYaml(path.join(ROOT, 'src/data/navigation.yaml'), navigation);

// ----------------------------------------------------------- globals ----
function globalValues(handle) {
  const config = readYaml(path.join(LARAVEL, 'content/globals', `${handle}.yaml`));
  // A site's globals can inherit another site's values (`sites: {site: origin}`).
  const origin = config.sites?.[SITE] ?? null;
  const own = exists(path.join(LARAVEL, 'content/globals', SITE, `${handle}.yaml`))
    ? readYaml(path.join(LARAVEL, 'content/globals', SITE, `${handle}.yaml`))
    : {};
  const inherited =
    origin && exists(path.join(LARAVEL, 'content/globals', origin, `${handle}.yaml`))
      ? readYaml(path.join(LARAVEL, 'content/globals', origin, `${handle}.yaml`))
      : {};
  return { ...inherited, ...own };
}
const seoGlobal = globalValues('seo');
if (seoGlobal.publisher_logo) seoGlobal.publisher_logo = `/media/${seoGlobal.publisher_logo}`;
if (seoGlobal.default_image) seoGlobal.default_image = `/media/${seoGlobal.default_image}`;
const site = {
  ...sites[SITE],
  // Sections with a feed of their own at /{section}/feed.xml (config/site.php).
  feeds: FEEDS,
  other_sites: Object.values(sites)
    .filter((s) => s.handle !== SITE)
    .map(({ handle, name, url }) => ({ handle, name, url })),
  settings: globalValues('settings'),
  seo: seoGlobal,
  marketing: globalValues('marketing'),
};
writeYaml(path.join(ROOT, 'src/data/site.yaml'), site);

// --------------------------------------------------------- redirects ----
const redirects = [];
for (const name of ['all', SITE]) {
  const file = path.join(LARAVEL, 'content/redirects', `${name}.yaml`);
  if (!exists(file)) continue;
  for (const r of readYaml(file) ?? [])
    if (r.source && r.target) redirects.push({ source: r.source, target: r.target });
}
writeYaml(path.join(ROOT, 'src/data/redirects.yaml'), redirects);

// ------------------------------------------------------------ titles ----
const titles = {};
for (const entry of entries.values()) {
  if (!entry.published || !entry.url) continue;
  titles[String(entry.data.title).trim().toLowerCase()] = entry.site === SITE ? entry.url : absolute(entry);
}
write(path.join(ROOT, 'src/data/titles.json'), JSON.stringify(titles, null, 2) + '\n');

// ------------------------------------------------------------- media ----
if (COPY_MEDIA) {
  for (const rel of PUBLIC_FILES) {
    const from = path.join(LARAVEL, 'public', rel);
    const to = path.join(ROOT, 'public', rel);
    if (!exists(from)) {
      console.warn(`media: ${rel} not found`);
      continue;
    }
    fs.rmSync(to, { recursive: true, force: true });
    fs.cpSync(from, to, { recursive: true, filter: (src) => !src.includes('/.meta') });
  }
}

// ---------------------------------------------------------- manifest ----
manifest.sort((a, b) => a.url.localeCompare(b.url));
write(path.join(ROOT, 'DEV_FILES/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(`Imported ${SITE} from ${LARAVEL}`);
for (const [c, n] of Object.entries(report.counts)) console.log(`  ${c}: ${n}`);
console.log(
  `  urls in manifest: ${manifest.length}; titles: ${Object.keys(titles).length}; redirects: ${redirects.length}`,
);
if (report.drafts.length) console.log(`  drafts: ${report.drafts.join(', ')}`);
if (report.noUrl.length) console.log(`  published without a URL: ${report.noUrl.join(', ')}`);
if (report.unresolved.length) console.log(`  unresolved references:\n    ${report.unresolved.join('\n    ')}`);
