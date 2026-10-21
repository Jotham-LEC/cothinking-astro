// The page model: entries from any loader (Astro's collections at build time,
// the files on disk for `npm run check` and the tests) become Pages with
// their addresses, and the helpers every other module shares.
import { naturalCompare } from './natural.ts';
import { resolveUrls } from './urls.ts';
import type { Collections, Page, RawEntry, Seo } from './types.ts';

const asDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const asString = (value: unknown): string | null => (typeof value === 'string' && value !== '' ? value : null);

export function toPages(raws: RawEntry[], collections: Collections): Page[] {
  const items = raws.map((raw) => {
    const d = raw.data;
    const page: Page = {
      collection: raw.collection,
      slug: raw.slug,
      url: null,
      title: String(d.title ?? raw.slug),
      description: asString(d.description),
      image: asString(d.image),
      date: asDate(d.date),
      updated: asDate(d.updated),
      draft: d.draft === true,
      template: asString(d.template) ?? collections[raw.collection]?.template ?? null,
      order: typeof d.order === 'number' ? d.order : null,
      parent: asString(d.parent),
      type: raw.collection === 'notes' ? (asString(d.type) ?? 'text') : null,
      seo: d.seo && typeof d.seo === 'object' ? (d.seo as Seo) : {},
      body: raw.body,
      data: d,
    };
    return page;
  });
  const urls = resolveUrls(items, collections);
  for (const page of items) page.url = urls.get(page) ?? null;
  return items;
}

/** The pages a reader can see: published, with an address. */
export const published = (pages: Page[]): Page[] => pages.filter((p) => !p.draft && p.url !== null);

export const byUrl = (pages: Page[]): Map<string, Page> => new Map(pages.filter((p) => p.url).map((p) => [p.url!, p]));

/** Whether a page is a section's child (its collection is mounted on a landing page). */
export const isChild = (page: Page, collections: Collections): boolean => Boolean(collections[page.collection]?.mount);

/** The collection mounted on a landing page, if any. */
export function mountedOn(page: Page, collections: Collections): string | null {
  for (const [handle, c] of Object.entries(collections)) {
    if (c.mount && c.mount.collection === page.collection && c.mount.slug === page.slug) return handle;
  }
  return null;
}

/** The section a page belongs to: its own collection when mounted, else the collection mounted on it. */
export function sectionOf(page: Page, collections: Collections): string | null {
  return isChild(page, collections) ? page.collection : mountedOn(page, collections);
}

/** The landing page a collection is mounted on. */
export function landingOf(handle: string, pages: Page[], collections: Collections): Page | null {
  const mount = collections[handle]?.mount;
  return mount ? (pages.find((p) => p.collection === mount.collection && p.slug === mount.slug) ?? null) : null;
}

/** Newest first, then by title (Statamic's `date:desc|title:asc`). */
export function byDateDesc(pages: Page[]): Page[] {
  return [...pages].sort(
    (a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || a.title.localeCompare(b.title),
  );
}

/** Oldest first (the notes pager): the newest-first order reversed, so two pages sharing a date keep their relative order. */
export function byDateAsc(pages: Page[]): Page[] {
  return byDateDesc(pages).reverse();
}

/** A section's published pages: in tree order when orderable, else newest first. */
export function childrenOf(handle: string, pages: Page[], collections: Collections): Page[] {
  const own = published(pages).filter((p) => p.collection === handle);
  return collections[handle]?.orderable ? [...own].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : byDateDesc(own);
}

/** Natural, case-insensitive title order (PHP's SORT_NATURAL | SORT_FLAG_CASE). */
export const naturalTitle = { compare: naturalCompare };
export const byTitle = (pages: Page[]): Page[] => [...pages].sort((a, b) => naturalTitle.compare(a.title, b.title));

/** The home page: the root of the site's pages tree. */
export const home = (pages: Page[]): Page | null => pages.find((p) => p.url === '/') ?? null;

/** The label of a select option (a publication's outlet). */
export function optionLabel(
  collections: Collections,
  collection: string,
  field: string,
  value: unknown,
): string | null {
  const options = collections[collection]?.options?.[field];
  return typeof value === 'string' ? (options?.[value] ?? value) : null;
}

/** A page by its `{collection}/{slug}` key (how navigations and references name one). */
export function pageByKey(pages: Page[], key: string | undefined | null): Page | null {
  if (!key) return null;
  const [collection, ...rest] = key.split('/');
  const slug = rest.join('/');
  return pages.find((p) => p.collection === collection && p.slug === slug) ?? null;
}
