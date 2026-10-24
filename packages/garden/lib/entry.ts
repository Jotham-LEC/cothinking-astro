// The entry model the garden works on: every content entry, from any
// collection of either site, as a SiteEntry with its address and the fields
// the garden reads (null where a site has no such field), both from the
// site's config. `toSiteEntry` is
// the one mapper, used by Astro's loader (load.ts) and the disk scan
// (scan.ts); a site's views keep their own typed entry for the rest.
import { year } from './dates.ts';
import type { SiteConfig } from './site.ts';

export type Seo = {
  title?: string;
  description?: string;
  /** Where the piece was first published: search engines are sent there. */
  canonical?: string;
  /** `profile` on the home page of a person's site (`og:type` and the ProfilePage). */
  og_type?: 'profile';
  noindex?: boolean;
};

export type SiteEntry = {
  collection: string;
  id: string;
  /** Site-relative (`/`, `/essays/x`). */
  url: string;
  title: string;
  description: string | null;
  /** The page's picture (Astro's image metadata), for the share image. */
  image: { src: string; width: number; height: number } | null;
  date: Date | null;
  updated: Date | null;
  draft: boolean;
  body: string;
  /** The opening paragraphs, as plain text (rehype-excerpt): a description when the page has none. */
  paragraphs: string[];
  seo: Seo;
  order: number | null;
  /** A post's type, in a collection with `types` (notes). */
  type: string | null;
  category: string | null;
  series: string | null;
  part: number | null;
  /** A quote note's quote and who said it. */
  quote: string | null;
  cite: string | null;
};

/** A site's rule for an entry's address: `urlOf(collection, id)`. */
export type UrlOf = (collection: string, id: string) => string;

/**
 * A site's address rule, from its collections: `pages/home` is `/`, a `pages` entry is `/<id>`, any other
 * collection's entry is `<path>/<id>` (its `path`, else `/<landing>`). A collection the config lacks throws.
 */
export function makeUrlOf(site: SiteConfig): UrlOf {
  return (collection, id) => {
    if (collection === 'pages' && id === 'home') return '/';
    const c = site.collections[collection];
    if (!c) throw new Error(`No ${collection} collection in site.config.ts.`);
    return `${c.path ?? (c.landing ? `/${c.landing}` : '')}/${id}`;
  };
}

export type RawEntry = {
  collection: string;
  id: string;
  data: Record<string, unknown>;
  body?: string;
  /** What Astro's loader rendered (its metadata holds the plugins' front matter); the scan has none. */
  rendered?: { metadata?: Record<string, unknown> };
};

const asDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};
const asString = (value: unknown): string | null => (typeof value === 'string' && value !== '' ? value : null);
const asNumber = (value: unknown): number | null => (typeof value === 'number' ? value : null);
const asImage = (value: unknown): SiteEntry['image'] => {
  const v = value as { src?: unknown; width?: unknown; height?: unknown } | null;
  return v &&
    typeof v === 'object' &&
    typeof v.src === 'string' &&
    typeof v.width === 'number' &&
    typeof v.height === 'number'
    ? { src: v.src, width: v.width, height: v.height }
    : null;
};

export function toSiteEntry({ collection, id, data, body, rendered }: RawEntry, site: SiteConfig): SiteEntry {
  const paragraphs = (rendered?.metadata?.frontmatter as Record<string, unknown> | undefined)?.paragraphs;
  const types = site.collections[collection]?.types;
  return {
    collection,
    id,
    url: makeUrlOf(site)(collection, id),
    title: String(data.title ?? id),
    description: asString(data.description),
    image: asImage(data.image),
    date: asDate(data.date),
    updated: asDate(data.updated),
    draft: data.draft === true,
    body: body ?? '',
    paragraphs: Array.isArray(paragraphs) ? paragraphs.map(String) : [],
    seo: data.seo && typeof data.seo === 'object' ? (data.seo as Seo) : {},
    order: asNumber(data.order),
    type: types ? (asString(data.type) ?? Object.keys(types)[0] ?? null) : null,
    category: asString(data.category),
    series: asString(data.series),
    part: asNumber(data.part),
    quote: asString(data.quote),
    cite: asString(data.cite),
  };
}

/** How a republished column opens: its credit line, which describes the outlet, not the piece. */
const CREDIT_LINE = 'This article first appeared';

/**
 * What an entry is about, for the head, llms.txt and a listing's cards: its `seo.description`, its `description`, a
 * quote post's quote, else the body's first paragraph (past a column's credit line, unless `skipCreditLine` is false).
 */
export function descriptionOf(entry: SiteEntry, { skipCreditLine = true } = {}): string | null {
  const own = entry.seo.description ?? entry.description ?? entry.quote;
  if (own) return own;
  const first = entry.paragraphs[0] ?? null;
  if (skipCreditLine && first !== null && first.startsWith(CREDIT_LINE))
    return entry.paragraphs.find((p) => !p.startsWith(CREDIT_LINE)) ?? null;
  return first;
}

export const keyOf = (entry: { collection: string; id: string }) => `${entry.collection}/${entry.id}`;

/** The entries a reader can see. */
export const published = (entries: SiteEntry[]): SiteEntry[] => entries.filter((e) => !e.draft);

export const indexByUrl = (entries: SiteEntry[]): Map<string, SiteEntry> => new Map(entries.map((e) => [e.url, e]));

/** An entry by its `collection/id` key (how navigations and references name one). */
export function findByKey(entries: SiteEntry[], key: string | undefined | null): SiteEntry | null {
  if (!key) return null;
  return entries.find((e) => keyOf(e) === key) ?? null;
}

/** Whether an entry is a section's page (its collection hangs under a landing page). */
export const isSectionPage = (entry: SiteEntry, site: SiteConfig): boolean =>
  site.collections[entry.collection]?.landing !== undefined;

/** The collection whose landing page this is, if any. */
export function sectionOfLanding(entry: SiteEntry, site: SiteConfig): string | null {
  if (entry.collection !== 'pages') return null;
  for (const [handle, c] of Object.entries(site.collections)) if (c.landing === entry.id) return handle;
  return null;
}

/** Newest first, then by title (Statamic's `date:desc|title:asc`). */
export function sortNewestFirst(entries: SiteEntry[]): SiteEntry[] {
  return [...entries].sort(
    (a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || a.title.localeCompare(b.title),
  );
}

/** Oldest first (the notes pager): the newest-first order reversed, so two entries sharing a date keep their relative order. */
export const sortOldestFirst = (entries: SiteEntry[]): SiteEntry[] => sortNewestFirst(entries).reverse();

/** A collection's published entries in its listing order: by `order`, or newest first. */
export function childrenOf(collection: string, entries: SiteEntry[], site: SiteConfig): SiteEntry[] {
  const own = published(entries).filter((e) => e.collection === collection);
  return site.collections[collection]?.order === 'order'
    ? [...own].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : sortNewestFirst(own);
}

export const home = (entries: SiteEntry[]): SiteEntry | null => entries.find((e) => e.url === '/') ?? null;

/** Entries grouped by the year of their date (display timezone), in the order given (newest first). */
export function groupByYear(entries: SiteEntry[]): [string, SiteEntry[]][] {
  const groups = new Map<string, SiteEntry[]>();
  for (const e of entries) {
    const y = e.date ? year(e.date) : '';
    groups.set(y, [...(groups.get(y) ?? []), e]);
  }
  return [...groups.entries()];
}
