// The index behind a page's links to other pages: each published page's
// address (a path on this site, a full address on the other) by its
// lower-cased title (what `[[Title]]` names) and by its file (`collection/id`,
// what a relative link such as `[text](../essays/x.md)` names, the one Emacs
// follows). Titles are unique across both sites (check.ts enforces it).
import path from 'node:path';
import { absolute } from './site.ts';
import { keyOf, type SiteEntry } from './entry.ts';

export type LinkIndex = {
  /** Lower-cased title → address. */
  titles: Record<string, string>;
  /** This site's pages, `collection/id` → path. */
  files: Record<string, string>;
  /** The other site's pages, `collection/id` → full address. */
  otherFiles: Record<string, string>;
  /** The other site's folder under sites/: a link into `../<folder>/src/content/` is a link to it. */
  otherFolder: string;
};

export const normaliseTitle = (title: string): string => title.replace(/\\$/, '').trim().toLowerCase();

/** This site's published pages, over the other site's. */
export function linkIndex(own: SiteEntry[], other: SiteEntry[] = [], otherUrl = '', otherFolder = ''): LinkIndex {
  const index: LinkIndex = { titles: {}, files: {}, otherFiles: {}, otherFolder };
  for (const e of other)
    if (!e.draft) {
      const url = absolute(otherUrl, e.url);
      index.titles[normaliseTitle(e.title)] = url;
      index.otherFiles[keyOf(e)] = url;
    }
  for (const e of own)
    if (!e.draft) {
      index.titles[normaliseTitle(e.title)] = e.url;
      index.files[keyOf(e)] = e.url;
    }
  return index;
}

export function resolveTitle(index: LinkIndex, title: string): string | null {
  return index.titles[normaliseTitle(title)] ?? null;
}

/** Whether a link's address names a Markdown file by a relative path (`x.md`, `../essays/x.md#part`). */
export const isFileLink = (url: string): boolean =>
  !/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('/') && /\.md(#|$)/.test(url);

/** The content file a relative link names, from the page that holds it: on this site, the other, or neither. */
export type FileTarget = { site: 'own' | 'other' | null; key: string; hash: string };

/**
 * Where a relative `.md` link leads, from the file that holds it (`from`, as `src/content/essays/x.md`, relative to
 * the site's folder): a page of this site (`src/content/<collection>/<id>.md`), of the other one
 * (`../<folder>/src/content/<collection>/<id>.md`), or neither. A `#fragment` is kept as `hash`.
 */
export function fileTarget(index: Pick<LinkIndex, 'otherFolder'>, from: string, url: string): FileTarget {
  const at = url.indexOf('#');
  const file = decodeURI(at === -1 ? url : url.slice(0, at));
  const hash = at === -1 ? '' : url.slice(at);
  const to = path.posix.normalize(path.posix.join(path.posix.dirname(from), file));
  const own = /^src\/content\/([^/]+)\/([^/]+)\.md$/.exec(to);
  if (own) return { site: 'own', key: `${own[1]}/${own[2]}`, hash };
  const other = /^\.\.\/([^/]+)\/src\/content\/([^/]+)\/([^/]+)\.md$/.exec(to);
  if (other) return { site: other[1] === index.otherFolder ? 'other' : null, key: `${other[2]}/${other[3]}`, hash };
  return { site: null, key: to, hash };
}

/** A relative link's address: the page's, with its fragment; null when it names no published page. */
export function resolveFile(index: LinkIndex, target: FileTarget): string | null {
  const files = target.site === 'own' ? index.files : target.site === 'other' ? index.otherFiles : {};
  const url = files[target.key];
  return url ? url + target.hash : null;
}
