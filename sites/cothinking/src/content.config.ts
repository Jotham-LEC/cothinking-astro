// cothink.ing's collections: the shared pieces (the base fields, the seo
// block, the loader) from garden/content.ts; the enums from site.config.ts.
// A reference names another entry as `collection/id` (the tests' content
// check says when it names no page).
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { base, dated, enumOf, loader } from '../../../packages/garden/content.ts';
import { site } from './site.config.ts';

const reference = z.string().regex(/^[a-z_]+\/[\w-]+$/);
const ordered = { order: z.number().int() };

/** The site's own pages: each has a file in src/pages (or [slug].astro for the plain ones). */
const pages = defineCollection({
  loader: loader('pages'),
  schema: ({ image }) =>
    z
    .object({
      ...base(image),
      ...ordered,
      related_wiki: z.array(reference).optional(),
    })
    .strict(),
});

/** The problems I fix: the offer (`what_i_do`, a case study), then the how-to. */
const problems = defineCollection({
  loader: loader('problems'),
  schema: ({ image }) =>
    z
    .object({
      ...base(image),
      ...ordered,
      what_i_do: z.string().optional(),
      case_study: z.array(reference).max(1).optional(),
      case_study_line: z.string().optional(),
    })
    .strict(),
});

/** The wiki: articles by category, some in a series (`series`, `part`). */
const wiki = defineCollection({
  loader: loader('wiki'),
  schema: ({ image }) =>
    z
    .object({
      ...base(image),
      ...dated,
      author: enumOf(Object.keys(site.authors)).optional(),
      category: enumOf(Object.keys(site.collections.wiki.categories)).optional(),
      related_pages: z.array(reference).optional(),
      series: z.string().optional(),
      part: z.number().int().optional(),
    })
    .strict(),
});

/** The websites I have built: a tile each, and a case study when there is a write-up. */
const work = defineCollection({
  loader: loader('work'),
  schema: ({ image }) =>
    z
    .object({
      ...base(image),
      ...ordered,
      website: z.url().optional(),
      year: z.number().int().optional(),
      kind: z.string().optional(),
      eyebrow: z.string().optional(),
      quote: z.string().optional(),
      quote_by: z.string().optional(),
      quote_role: z.string().optional(),
      quote_photo: image().optional(),
      context: z.string().optional(),
      stats: z.array(z.object({ id: z.string(), value: z.string(), label: z.string() }).strict()).optional(),
      steps: z.array(z.object({ id: z.string(), title: z.string(), body: z.string() }).strict()).optional(),
    })
    .strict(),
});

export const collections = { pages, problems, wiki, work };
