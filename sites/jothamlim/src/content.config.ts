// jothamlim.com's collections: the shared pieces (the base fields, the seo
// block, the loader) from garden/content.ts; the enums from site.config.ts;
// the notes from Mastodon.
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { base, dated, loader } from '@garden/content.ts';
import { mastodonLoader } from '@garden/lib/mastodon.ts';
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

// The public posts of @jothamlec@mastodon.social (garden/lib/mastodon.ts): read at every build, so a post
// written, edited or deleted there is one here too.
const notes = defineCollection({
  loader: mastodonLoader({
    instance: 'mastodon.social',
    acct: 'jothamlec',
    timeZone: 'Asia/Kuala_Lumpur',
    skipTag: 'nosite',
    siteUrl: site.url,
  }),
  schema: z
    .object({
      title: z.string().min(1),
      ...dated,
      updated: z.coerce.date().optional(),
      draft: z.boolean().default(false),
      type: z.enum(Object.keys(site.collections.notes.types)),
      url: z.url(),
      media: z.array(
        z
          .object({
            kind: z.enum(['image', 'video']),
            src: z.url(),
            alt: z.string(),
            width: z.number().int().nullable(),
            height: z.number().int().nullable(),
          })
          .strict(),
      ),
      replies: z.number().int(),
      boosts: z.number().int(),
      favourites: z.number().int(),
    })
    .strict(),
});

const projects = defineCollection({
  loader: loader('projects'),
  schema: ({ image }) => z.object({ ...base(image), ...dated }).strict(),
});

const publications = defineCollection({
  loader: loader('publications'),
  schema: ({ image }) => z.object({ ...base(image), ...dated, outlet: z.enum(Object.keys(outlets)) }).strict(),
});

export const collections = { pages, essays, notes, projects, publications };
