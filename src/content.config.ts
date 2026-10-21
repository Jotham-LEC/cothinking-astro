import fs from 'node:fs';
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import YAML from 'yaml';

// The collections' model (titles, mounts, note types, select options) comes
// from the import (src/data/collections.yaml), so the enums below follow it.
const collectionsConfig = YAML.parse(
  fs.readFileSync(new URL('./data/collections.yaml', import.meta.url), 'utf8'),
) as Record<string, { types?: { handle: string }[]; options?: Record<string, Record<string, string>> }>;

const enumOf = (values: string[] | undefined) =>
  values && values.length ? z.enum(values as [string, ...string[]]) : z.string();
const noteTypes = collectionsConfig.notes?.types?.map((t) => t.handle);
const outlets = Object.keys(collectionsConfig.publications?.options?.outlet ?? {});

const publicFile = (file: string) => fs.existsSync(new URL(`../public${file}`, import.meta.url));

const seo = z
  .object({
    title: z.string(),
    description: z.string(),
    canonical: z.string().url(),
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
      link_url: z.string().url().optional(),
      link_title: z.string().optional(),
      link_image: z.string().optional(),
      video_url: z.string().url().optional(),
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

export const collections = { pages, essays, notes, projects, publications };
