// The schema pieces every site's src/content.config.ts shares: the `seo`
// block and the base fields of a page, and the loader for a content
// collection. A site calls `garden(new URL('.', import.meta.url))` with its
// src/ folder, as the media checks look in its public/.
import fs from 'node:fs';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/** An enum of the values given, or any string when there are none. */
export const enumOf = (values: string[]) => (values.length ? z.enum(values as [string, ...string[]]) : z.string());

/** The SEO group: a title and description of its own, where it was first published, and whether to index and list it. */
export const seo = z
  .object({
    title: z.string(),
    description: z.string(),
    canonical: z.url(),
    og_type: z.string(),
    noindex: z.boolean(),
    sitemap: z.boolean(),
  })
  .partial()
  .strict();

export const dated = { date: z.coerce.date() };

export function garden(src: URL) {
  const publicFile = (file: string) => fs.existsSync(new URL(`../public${file}`, src));

  /** A public media path (`/media/…`) that exists. */
  const media = (what: string) =>
    z
      .string()
      .startsWith('/media/')
      .refine(publicFile, { message: `${what} is not in public/media` });

  const base = {
    title: z.string().min(1),
    description: z.string().optional(),
    image: media('image').optional(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    seo: seo.default({}),
  };

  const loader = (name: string) => glob({ pattern: '**/*.md', base: `./src/content/${name}` });

  return { base, media, loader };
}
