import fs from 'node:fs';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';
import YAML from 'yaml';

// The collections' model (titles, mounts, note types, select options) comes
// from the import (src/data/collections.yaml), so the enums below follow it.
const model = YAML.parse(fs.readFileSync(new URL('./data/collections.yaml', import.meta.url), 'utf8')) as Record<
  string,
  { types?: { handle: string }[]; options?: Record<string, Record<string, string>> }
>;

const enumOf = (values: string[] | undefined) =>
  values && values.length ? z.enum(values as [string, ...string[]]) : z.string();
const noteTypes = model.notes?.types?.map((t) => t.handle);
const outlets = Object.keys(model.publications?.options?.outlet ?? {});

const publicFile = (file: string) => fs.existsSync(new URL(`../public${file}`, import.meta.url));

const seo = z
  .object({
    title: z.string(),
    description: z.string(),
    canonical: z.url(),
    og_type: z.string(),
    og_title: z.string(),
    og_description: z.string(),
    image: z.string().refine(publicFile, { message: 'seo.image is not in public/' }),
    max_snippet: z.number().int(),
    noindex: z.boolean(),
    nofollow: z.boolean(),
    sitemap: z.boolean(),
    nosnippet: z.boolean(),
    json_ld: z.string(),
  })
  .partial()
  .strict();

const base = {
  title: z.string().min(1),
  description: z.string().optional(),
  image: z.string().startsWith('/media/').refine(publicFile, { message: 'image is not in public/media' }).optional(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  seo: seo.default({}),
};

const dated = { date: z.coerce.date() };

const loader = (name: string) => glob({ pattern: '**/*.{md,mdx}', base: `./src/content/${name}` });

const pages = defineCollection({
  loader: loader('pages'),
  schema: z
    .object({
      ...base,
      template: z.enum(['default', 'home', 'section', 'notes/index', 'publications']).default('default'),
      order: z.number().int().optional(),
      parent: z.string().optional(),
    })
    .strict(),
});

const essays = defineCollection({
  loader: loader('essays'),
  schema: z.object({ ...base, ...dated, reshare: z.string().optional() }).strict(),
});

const notes = defineCollection({
  loader: loader('notes'),
  schema: z
    .object({
      ...base,
      ...dated,
      type: enumOf(noteTypes).default('text'),
      quote: z.string().optional(),
      cite: z.string().optional(),
      photos: z
        .array(z.string().startsWith('/media/').refine(publicFile, { message: 'photo is not in public/media' }))
        .optional(),
      link_url: z.url().optional(),
      link_title: z.string().optional(),
      link_image: z.string().optional(),
      video_url: z.url().optional(),
    })
    .strict(),
});

const projects = defineCollection({
  loader: loader('projects'),
  schema: z.object({ ...base, ...dated }).strict(),
});

const publications = defineCollection({
  loader: loader('publications'),
  schema: z.object({ ...base, ...dated, outlet: enumOf(outlets) }).strict(),
});

// ---- Data collections: what the import writes to src/data (Astro's file() loader reads YAML). ----

/** The site: name, URL, locale, attributes, and the Brand, Marketing and Settings globals. One entry, `site`. */
const site = defineCollection({
  loader: file('src/data/site.yaml', { parser: (text) => ({ site: YAML.parse(text) }) }),
  schema: z
    .object({
      handle: z.string(),
      name: z.string(),
      url: z.url(),
      locale: z.string(),
      lang: z.string(),
      attributes: z
        .object({
          logo: z.string().optional(),
          logo_dark: z.string().optional(),
          favicon: z.string().optional(),
          explorer: z.boolean().optional(),
          closed_panels: z.array(z.string()).optional(),
          pages: z.string().optional(),
        })
        .loose(),
      feeds: z.array(z.string()).default([]),
      other_sites: z.array(z.object({ handle: z.string(), name: z.string(), url: z.url() })).default([]),
      settings: z.record(z.string(), z.unknown()).default({}),
      seo: z.record(z.string(), z.unknown()).default({}),
      marketing: z.record(z.string(), z.unknown()).default({}),
    })
    .loose(),
});

/** Each content collection's model: title, route, mount, note types, select options, whether its pages are articles. Keyed by handle. */
const collectionsConfig = defineCollection({
  loader: file('src/data/collections.yaml'),
  schema: z
    .object({
      title: z.string(),
      route: z.string(),
      dated: z.boolean(),
      root: z.boolean(),
      orderable: z.boolean(),
      mount: z.object({ collection: z.string(), slug: z.string() }).optional(),
      template: z.string().optional(),
      og_type: z.string().optional(),
      schema: z.string().optional(),
      types: z.array(z.object({ handle: z.string(), title: z.string() })).optional(),
      options: z.record(z.string(), z.record(z.string(), z.string())).optional(),
    })
    .strict(),
});

type NavItemData = { title?: string; entry?: string; url?: string; children?: NavItemData[] };
const navItem: z.ZodType<NavItemData> = z.lazy(() =>
  z
    .object({
      title: z.string().optional(),
      entry: z.string().optional(),
      url: z.string().optional(),
      children: z.array(navItem).optional(),
    })
    .strict(),
);

/** The navigations (explorer, header, footer), each a tree of items naming an entry (`collection/slug`) or a URL. */
const navigation = defineCollection({
  loader: file('src/data/navigation.yaml'),
  schema: z.object({ items: z.array(navItem) }).strict(),
});

/** Old addresses and where they go; astro.config.mjs turns them into Astro redirects. */
const redirects = defineCollection({
  loader: file('src/data/redirects.yaml', {
    parser: (text) => (YAML.parse(text) as { source: string; target: string }[]).map((r) => ({ id: r.source, ...r })),
  }),
  // The parser adds `id` (the source) for the loader; zod drops it from the data.
  schema: z.object({ source: z.string(), target: z.string() }),
});

/** Who wrote an entry (an `author` field): Statamic's users, by slug. */
const authors = defineCollection({
  loader: file('src/data/authors.yaml'),
  schema: z
    .object({ id: z.string(), name: z.string(), bio: z.string().optional(), url: z.string().optional() })
    .strict(),
});

export const collections = {
  pages,
  essays,
  notes,
  projects,
  publications,
  site,
  collectionsConfig,
  navigation,
  redirects,
  authors,
};
