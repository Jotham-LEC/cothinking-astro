// The schema pieces every site's src/content.config.ts shares: the base
// fields of a page (with Astro's `image()` for its picture), the `seo` block,
// a dated collection's date, and the loader for a content collection.
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import type { SchemaContext } from 'astro:content';

/** The SEO group: a title and description of its own, where it was first published, and whether to index it. */
const seo = z
  .object({
    title: z.string(),
    description: z.string(),
    canonical: z.url(),
    og_type: z.string(),
    noindex: z.boolean(),
  })
  .partial()
  .strict();

export const dated = { date: z.coerce.date() };

/** Every page's fields: title, description, a picture (a file under src/assets, optimised by Astro), dates, draft, seo. */
export const base = (image: SchemaContext['image']) => ({
  title: z.string().min(1),
  description: z.string().optional(),
  image: image().optional(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  seo: seo.default({}),
});

export const loader = (name: string) => glob({ pattern: '**/*.md', base: `./src/content/${name}` });
