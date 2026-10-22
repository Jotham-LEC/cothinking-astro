// jothamlim.com's collections: its content collections here, the shared
// pieces (the base fields, the data collections) from garden/content.ts.
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { enumOf, garden } from '../../../garden/content.ts';

const { model, base, dated, media, loader, dataCollections } = garden(new URL('.', import.meta.url));

const noteTypes = model.notes?.types?.map((t) => t.handle);
const outlets = Object.keys(model.publications?.options?.outlet ?? {});

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
  schema: z.object({ ...base, ...dated }).strict(),
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
      photos: z.array(media('photo')).optional(),
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

export const collections = {
  pages,
  essays,
  notes,
  projects,
  publications,
  ...dataCollections,
};
