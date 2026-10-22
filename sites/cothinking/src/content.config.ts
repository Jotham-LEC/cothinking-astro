// cothink.ing's collections: its content collections here, the shared
// pieces (the base fields, the data collections) from garden/content.ts.
// A reference names another entry as `collection/slug` (check-content.ts
// checks that it exists).
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { enumOf, garden } from '../../../packages/garden/content.ts';

const { model, base, dated, media, loader, dataCollections } = garden(new URL('.', import.meta.url));

const categories = Object.keys(model.wiki?.options?.category ?? {});
const reference = z.string().regex(/^[a-z_]+\/[\w-]+$/);
const ordered = { order: z.number().int().optional() };

/** The site's own pages; `template` picks the view (src/pages/[...slug].astro). */
const cothinking_pages = defineCollection({
  loader: loader('cothinking_pages'),
  schema: z
    .object({
      ...base,
      ...ordered,
      template: z
        .enum([
          'cothinking/home',
          'cothinking/page',
          'cothinking/problems',
          'cothinking/wiki',
          'cothinking/work',
          'cothinking/how-i-work',
          'cothinking/websites',
        ])
        .default('cothinking/page'),
      parent: z.string().optional(),
      related_wiki: z.array(reference).optional(),
    })
    .strict(),
});

/** The problems I fix: the offer (`what_i_do`, a case study), then the how-to. */
const problems = defineCollection({
  loader: loader('problems'),
  schema: z
    .object({
      ...base,
      ...ordered,
      what_i_do: z.string().optional(),
      case_study: z.array(reference).max(1).optional(),
      case_study_line: z.string().optional(),
    })
    .strict(),
});

/** The wiki: articles by category, some in a series (`series`, `part`), one a reshare of an essay. */
const wiki = defineCollection({
  loader: loader('wiki'),
  schema: z
    .object({
      ...base,
      ...dated,
      author: z.string().optional(),
      category: enumOf(categories).optional(),
      related_pages: z.array(reference).optional(),
      reshare: reference.optional(),
      series: z.string().optional(),
      part: z.number().int().optional(),
    })
    .strict(),
});

/** The websites I have built: a tile each, and a case study when there is a write-up. */
const work = defineCollection({
  loader: loader('work'),
  schema: z
    .object({
      ...base,
      ...ordered,
      website: z.url().optional(),
      year: z.number().int().optional(),
      kind: z.string().optional(),
      eyebrow: z.string().optional(),
      quote: z.string().optional(),
      quote_by: z.string().optional(),
      quote_role: z.string().optional(),
      quote_photo: media('quote_photo').optional(),
      context: z.string().optional(),
      stats: z.array(z.object({ id: z.string(), value: z.string(), label: z.string() }).strict()).optional(),
      steps: z.array(z.object({ id: z.string(), title: z.string(), body: z.string() }).strict()).optional(),
    })
    .strict(),
});

/** Pieces of jothamlim.com a wiki entry reshares (`origin`): their text, and their address there (`url`). */
const reshared = defineCollection({
  loader: loader('reshared'),
  schema: z.object({ ...base, ...dated, url: z.url() }).strict(),
});

export const collections = {
  cothinking_pages,
  problems,
  wiki,
  work,
  reshared,
  ...dataCollections,
};
