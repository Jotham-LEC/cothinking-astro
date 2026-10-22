// The schema pieces every site's src/content.config.ts shares: the `seo`
// block and the base fields of a page, the loader for a content collection,
// and the data collections the import writes to src/data (the site, the
// collections' model, the navigations, and the authors on a site that has
// any). A site calls `garden(new URL('.', import.meta.url))`
// with its src/ folder, as the checks look in its public/.
import fs from 'node:fs';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';
import YAML from 'yaml';

type Model = Record<
  string,
  { types?: { handle: string }[]; options?: Record<string, Record<string, string>>; origin?: string }
>;

/** An enum of the values the import found (a select's options, the note types), or any string when there are none. */
export const enumOf = (values: string[] | undefined) =>
  values && values.length ? z.enum(values as [string, ...string[]]) : z.string();

export function garden(src: URL) {
  const publicFile = (file: string) => fs.existsSync(new URL(`../public${file}`, src));
  const authorsFile = new URL('./data/authors.yaml', src);

  // The collections' model (titles, mounts, note types, select options) comes
  // from the import (src/data/collections.yaml), so a site's enums follow it.
  const model = YAML.parse(fs.readFileSync(new URL('./data/collections.yaml', src), 'utf8')) as Model;

  const seo = z
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

  const dated = { date: z.coerce.date() };

  const loader = (name: string) => glob({ pattern: '**/*.md', base: `./src/content/${name}` });

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

  /** Each content collection's model: title, route, mount, note types, select options, whether its pages are articles, and the flags for the Explorer and the graph (CollectionConfig in garden/lib/types.ts). Keyed by handle. */
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
        group_by: z.enum(['year', 'category']).optional(),
        explorer: z.literal('with_content').optional(),
        graph_section: z.boolean().optional(),
        graph_colour: z.enum(['essays', 'notes', 'publications', 'projects', 'pages']).optional(),
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

  /** Who wrote an entry (an `author` field): Statamic's users, by slug. The import writes the file only when there are any. */
  const authors = defineCollection({
    loader: file('src/data/authors.yaml'),
    schema: z
      .object({ id: z.string(), name: z.string(), bio: z.string().optional(), url: z.string().optional() })
      .strict(),
  });

  const dataCollections = {
    site,
    collectionsConfig,
    navigation,
    ...(fs.existsSync(authorsFile) ? { authors } : {}),
  };

  return { model, seo, base, dated, media, loader, dataCollections };
}
