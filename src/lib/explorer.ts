// The Explorer: the site as one tree, from the `explorer` navigation. A nav
// item whose page has a collection mounted on it is a folder holding that
// collection's pages (notes: one row per post type in use; publications: a
// group per year). At each level single pages come before folders; text-only
// items holding nothing are dropped, so are drafts. Also the header, drawer
// and footer links (App\Tags\Wiki).
import { childrenOf, isChild, mountedOn, naturalTitle, pageByKey, published } from './pages.ts';
import type { Collections, NavItem, Page, SiteConfig } from './types.ts';
import { pathOf } from './urls.ts';
import { year } from './dates.ts';

export type Row = {
  id: string | null;
  title: string;
  url: string | null;
  kind: 'page' | 'folder' | 'type';
  isCurrent: boolean;
  isOpen: boolean;
  children: Row[];
};

export type Site = { pages: Page[]; collections: Collections; navigation: Record<string, NavItem[]>; site: SiteConfig };

export const keyOf = (page: Page) => `${page.collection}/${page.slug}`;

const row = (page: Page | null, title?: string): Row => ({
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

export function explorerRows({ pages, collections, navigation }: Site): Row[] {
  const live = published(pages);
  const navRows = (items: NavItem[]): Row[] => {
    const rows: Row[] = [];
    for (const item of items) {
      const entry = pageByKey(pages, item.entry);
      const title = item.title ?? entry?.title ?? '';
      if (item.entry && (!entry || entry.draft || !entry.url)) continue;
      const section = entry ? mountedOn(entry, collections) : null;
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

  const folder = (landing: Page, section: string, title: string): Row => {
    const config = collections[section]!;
    let children: Row[];
    if (config.types) {
      children = noteTypesInUse(live, section, config.types).map((t) =>
        group(t.title, `${landing.url}/type/${t.handle}`, [], null, 'type'),
      );
    } else if (section === 'publications') {
      // The archive by year, as its landing page (`publications` template) lists it: this site's one dated archive.
      children = byYear(childrenOf(section, live, collections)).map(([y, pieces]) =>
        group(
          y,
          `${landing.url}#${y}`,
          pieces.map((p) => row(p)),
        ),
      );
    } else {
      children = childrenOf(section, live, collections).map((p) => row(p));
    }
    return group(title, landing.url, children, keyOf(landing));
  };

  return navRows(navigation.explorer ?? []);
}

/** Pieces grouped by the year of their date (display timezone), newest first. */
export function byYear(pieces: Page[]): [string, Page[]][] {
  const groups = new Map<string, Page[]>();
  for (const p of pieces) {
    const y = p.date ? year(p.date) : '';
    groups.set(y, [...(groups.get(y) ?? []), p]);
  }
  return [...groups.entries()];
}

/** The post types with a published note, in blueprint order. */
export function noteTypesInUse(live: Page[], collection: string, types: { handle: string; title: string }[]) {
  const inUse = new Set(live.filter((p) => p.collection === collection).map((p) => p.type ?? types[0]?.handle));
  return types.filter((t) => inUse.has(t.handle));
}

/** Marks the current page's row and opens every row holding it. A type's listing has no page, so it is current by address. */
export function markCurrent(rows: Row[], current: Page | null, url: string): Row[] {
  const currentId = current ? keyOf(current) : null;
  return rows.map((r) => {
    const children = markCurrent(r.children, current, url);
    const isCurrent = r.id !== null ? r.id === currentId : r.kind === 'type' && r.url === url;
    return { ...r, children, isCurrent, isOpen: isCurrent || children.some((c) => c.isCurrent || c.isOpen) };
  });
}

export function urlsIn(row: Row): string[] {
  return [...(row.url ? [row.url] : []), ...row.children.flatMap(urlsIn)];
}

export type Link = { title: string; url: string; isCurrent: boolean };

/** The header navigation's links, as `nav:header` gives them. */
export function headerLinks({ pages, navigation }: Site, currentUrl: string | null): Link[] {
  return (navigation.header ?? []).flatMap((item) => {
    const entry = pageByKey(pages, item.entry);
    const url = entry?.url ?? item.url;
    if (!url || (item.entry && (!entry || entry.draft))) return [];
    return [
      { title: item.title ?? entry?.title ?? '', url, isCurrent: currentUrl !== null && pathOf(url) === currentUrl },
    ];
  });
}

/** The drawer's menu: the header's links but the last (the call to action), minus those the Explorer already lists. */
export function menu(site: Site, currentUrl: string | null): Link[] {
  const listed = new Set(explorerRows(site).flatMap(urlsIn).map(pathOf));
  return headerLinks(site, currentUrl)
    .slice(0, -1)
    .filter((link) => !listed.has(pathOf(link.url)));
}

/** The footer navigation: a heading per top-level item with its children as links. */
export function footerColumns({
  pages,
  navigation,
}: Site): { title: string; children: { title: string; url: string }[] }[] {
  return (navigation.footer ?? []).map((item) => ({
    title: item.title ?? pageByKey(pages, item.entry)?.title ?? '',
    children: (item.children ?? []).flatMap((child) => {
      const entry = pageByKey(pages, child.entry);
      const url = entry?.url ?? child.url;
      return url ? [{ title: child.title ?? entry?.title ?? '', url }] : [];
    }),
  }));
}

/** Natural title order, for lists of pages. */
export const sortByTitle = <T extends { title: string }>(items: T[]) =>
  [...items].sort((a, b) => naturalTitle.compare(a.title, b.title));

export { isChild };
