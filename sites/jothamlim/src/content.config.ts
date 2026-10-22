// jothamlim.com's collections: the shared pieces (the base fields, the seo
// block, the loader) from garden/content.ts; the enums from site.config.ts.
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { base, dated, enumOf, loader } from '../../../packages/garden/content.ts';
import { outlets, site } from './site.config.ts';

const pages = defineCollection({
  loader: loader('pages'),
  schema: ({ image }) =>
    z
      .object({
        ...base(image),
        order: z.number().int(),
      })
      .strict(),
});

const essays = defineCollection({
  loader: loader('essays'),
  schema: ({ image }) => z.object({ ...base(image), ...dated }).strict(),
});

const notes = defineCollection({
  loader: loader('notes'),
  schema: ({ image }) =>
    z
      .object({
        ...base(image),
        ...dated,
        type: enumOf(Object.keys(site.collections.notes.types)).default('text'),
        quote: z.string().optional(),
        cite: z.string().optional(),
      })
      .strict(),
});

const projects = defineCollection({
  loader: loader('projects'),
  schema: ({ image }) => z.object({ ...base(image), ...dated }).strict(),
});

const publications = defineCollection({
  loader: loader('publications'),
  schema: ({ image }) => z.object({ ...base(image), ...dated, outlet: enumOf(Object.keys(outlets)) }).strict(),
});

export const collections = { pages, essays, notes, projects, publications };
