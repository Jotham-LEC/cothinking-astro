// The Explorer: the site as one tree, from the `explorer` navigation. A nav
// item whose page is a section's landing page is a folder holding that
// section's pages, as the collection's `explorer` says: every page (`all`),
// one row per post type in use (`by-type`), a group per year (`by-year`), a
// group per category, A–Z, "Other" last (`by-category`), or only the pages
// with a body (`with-body`). At each level single pages come
// before folders; text-only items holding nothing are dropped, so are
// drafts. Also the header, drawer and footer links, and which panels a page
// has.
import { findByKey, groupByYear, childrenOf, keyOf, sectionOfLanding, type SiteEntry } from './entry.ts';
import { naturalCompare } from './natural.ts';
import { isExternal, pathOf, type NavItem, type SiteConfig } from './site.ts';

export type Row = {
  id: string | null;
  title: string;
  url: string | null;
  kind: 'page' | 'folder' | 'type';
  isCurrent: boolean;
  isOpen: boolean;
  children: Row[];
};

const row = (page: SiteEntry | null, title?: string): Row => ({
  id: page ? keyOf(page) : null,
  title: title ?? page?.title ?? '',
  url: page?.url ?? null,
  kind: 'page',
  isCurrent: false,
  isOpen: false,
  children: [],
});
const group = (
  title: string,
  url: string | null,
  children: Row[],
  id: string | null = null,
  kind: Row['kind'] = 'folder',
): Row => ({ id, title, url, kind, isCurrent: false, isOpen: false, children });

/** The whole tree, from the published entries. */
export function explorerRows(live: SiteEntry[], site: SiteConfig): Row[] {
  const navRows = (items: NavItem[]): Row[] => {
    const rows: Row[] = [];
    for (const item of items) {
      const entry = findByKey(live, item.entry);
      const title = item.title ?? entry?.title ?? '';
      if (item.entry && !entry) continue;
      const section = entry ? sectionOfLanding(entry, site) : null;
      if (entry && section) {
        rows.push(folder(entry, section, title));
        continue;
      }
      const children = navRows(item.children ?? []);
      if (children.length)
        rows.push(group(title, entry?.url ?? item.url ?? null, children, entry ? keyOf(entry) : null));
      else if (entry) rows.push(row(entry, title));
      else if (item.url) rows.push({ ...row(null, title), url: item.url });
    }
    return [...rows.filter((r) => r.kind === 'page'), ...rows.filter((r) => r.kind !== 'page')];
  };

  const folder = (landing: SiteEntry, section: string, title: string): Row => {
    const config = site.collections[section]!;
    const pages = childrenOf(section, live, site);
    const children = (): Row[] => {
      switch (config.explorer ?? 'all') {
        case 'by-type':
          return noteTypesInUse(live, section, config.types ?? {}).map(([handle, name]) =>
            group(name, `${landing.url}/type/${handle}`, [], null, 'type'),
          );
        case 'by-year':
          return groupByYear(pages).map(([y, pieces]) =>
            group(
              y,
              `${landing.url}#${y}`,
              pieces.map((p) => row(p)),
            ),
          );
        case 'by-category':
          return groupByCategory(pages, config.categories ?? {}, (e) => e).map((c) =>
            group(
              c.title,
              `${landing.url}#${c.handle}`,
              c.entries.map((p) => row(p)),
            ),
          );
        case 'with-body':
          return pages.filter((p) => p.body.trim() !== '').map((p) => row(p));
        case 'all':
          return pages.map((p) => row(p));
      }
    };
    return group(title, landing.url, children(), keyOf(landing));
  };

  return navRows(site.navigation.explorer);
}

/**
 * Entries by their `category`, in the categories' order, each A–Z; the rest last as "Other".
 * `fields` reads an entry's title and category: the entry itself for a SiteEntry, `entry.data` for one of Astro's.
 */
export function groupByCategory<T>(
  entries: T[],
  categories: Record<string, string>,
  fields: (entry: T) => { title: string; category?: string | null },
): { handle: string; title: string; entries: T[] }[] {
  const sorted = [...entries].sort((a, b) => naturalCompare(fields(a).title, fields(b).title));
  const out: { handle: string; title: string; entries: T[] }[] = [];
  for (const [handle, title] of Object.entries(categories)) {
    const own = sorted.filter((e) => fields(e).category === handle);
    if (own.length) out.push({ handle, title, entries: own });
  }
  const other = sorted.filter((e) => {
    const category = fields(e).category;
    return !(category && category in categories);
  });
  if (other.length) out.push({ handle: 'other', title: 'Other', entries: other });
  return out;
}

/** The post types with a published entry, as `[handle, title]` in the config's order. */
export function noteTypesInUse(
  live: SiteEntry[],
  collection: string,
  types: Record<string, string>,
): [string, string][] {
  const inUse = new Set(live.filter((e) => e.collection === collection).map((e) => e.type));
  return Object.entries(types).filter(([handle]) => inUse.has(handle));
}

/**
 * Marks the current page's row and opens every row holding it. A type's listing has no page, so it is current by
 * address. A page at another address than its entry's (/notes/2) opens the entry's row but is not that page.
 */
export function markCurrent(rows: Row[], current: SiteEntry | null, url: string): Row[] {
  const currentId = current ? keyOf(current) : null;
  return rows.map((r) => {
    const children = markCurrent(r.children, current, url);
    const isEntry = r.id !== null && r.id === currentId;
    const isCurrent = r.id !== null ? isEntry && r.url === url : r.kind === 'type' && r.url === url;
    return { ...r, children, isCurrent, isOpen: isEntry || isCurrent || children.some((c) => c.isCurrent || c.isOpen) };
  });
}

export function urlsIn(row: Row): string[] {
  return [...(row.url ? [row.url] : []), ...row.children.flatMap(urlsIn)];
}

export type Link = { title: string; url: string; isCurrent: boolean };

/** The header navigation's links; one to another site is never the current page. */
export function headerLinks(live: SiteEntry[], site: SiteConfig, currentUrl: string | null): Link[] {
  return site.navigation.header.flatMap((item) => {
    const entry = findByKey(live, item.entry);
    const url = entry?.url ?? item.url;
    if (!url || (item.entry && !entry)) return [];
    return [
      {
        title: item.title ?? entry?.title ?? '',
        url,
        isCurrent: currentUrl !== null && !isExternal(url, site.url) && pathOf(url) === currentUrl,
      },
    ];
  });
}

/** The drawer's menu: the header's links but the last (the call to action), minus those the Explorer already lists. */
export function menu(live: SiteEntry[], site: SiteConfig, currentUrl: string | null, explorer: Row[]): Link[] {
  const listed = new Set(explorer.flatMap(urlsIn).map(pathOf));
  return headerLinks(live, site, currentUrl)
    .slice(0, -1)
    .filter((link) => !listed.has(pathOf(link.url)));
}

/** Whether a page has an Explorer (every page but a room) and a drawer (the Explorer, or a menu of more than one link). */
export function panels(
  live: SiteEntry[],
  site: SiteConfig,
  room: boolean,
): { hasExplorer: boolean; hasDrawer: boolean } {
  const hasExplorer = !room;
  return { hasExplorer, hasDrawer: hasExplorer || headerLinks(live, site, null).length > 1 };
}

/** The footer navigation: a heading per top-level item with its children as links. */
export function footerColumns(
  live: SiteEntry[],
  site: SiteConfig,
): { title: string; children: { title: string; url: string }[] }[] {
  return site.navigation.footer.map((item) => ({
    title: item.title ?? findByKey(live, item.entry)?.title ?? '',
    children: (item.children ?? []).flatMap((child) => {
      const entry = findByKey(live, child.entry);
      const url = entry?.url ?? child.url;
      return url ? [{ title: child.title ?? entry?.title ?? '', url }] : [];
    }),
  }));
}
