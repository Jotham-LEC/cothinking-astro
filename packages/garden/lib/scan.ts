// The entries read off the disk, for what runs outside Astro's collections:
// garden/config.mjs (the [[wiki link]] title index, the sitemap) and the
// tests. Each `src/content/<collection>/<id>.md` is parsed with Astro's own
// front-matter reader, so the ids match the glob loader's. The index is
// read once per `astro build`, and again on every render in `astro dev`, so
// a renamed page shows without a restart.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { published, toSiteEntry, type RawEntry, type SiteEntry } from './entry.ts';
import type { SiteConfig } from './site.ts';
import { titleIndex, type TitleIndex } from './titles.ts';

/** A site folder's `src/content`, every collection in it, as the front matter and body of each file. */
export function scanRaw(root: URL | string): RawEntry[] {
  const dir = path.join(typeof root === 'string' ? root : fileURLToPath(root), 'src/content');
  const raws: RawEntry[] = [];
  for (const collection of fs.readdirSync(dir).sort()) {
    const folder = path.join(dir, collection);
    if (!fs.statSync(folder).isDirectory()) continue;
    for (const file of fs.readdirSync(folder).sort()) {
      if (!file.endsWith('.md')) continue;
      const { frontmatter, content } = parseFrontmatter(fs.readFileSync(path.join(folder, file), 'utf8'));
      raws.push({ collection, id: file.slice(0, -3), data: frontmatter, body: content });
    }
  }
  return raws;
}

/** The same, as SiteEntries. */
export const scanEntries = (root: URL | string, site: SiteConfig): SiteEntry[] =>
  scanRaw(root).map((raw) => toSiteEntry(raw, site));

export type Scan = { root: URL | string; site: SiteConfig };

/** The title index for a site: its published pages over the other site's, by full address. */
function scanTitles(site: Scan, other: Scan & { url: string }): TitleIndex {
  return titleIndex(
    published(scanEntries(site.root, site.site)),
    published(scanEntries(other.root, other.site)),
    other.url,
  );
}

/** `scanTitles`, read once in a build and on every call in dev. */
export function lazyTitles(site: Scan, other: Scan & { url: string }): () => TitleIndex {
  let cached: TitleIndex | null = null;
  return () => {
    if (process.env.NODE_ENV !== 'production') return scanTitles(site, other);
    cached ??= scanTitles(site, other);
    return cached;
  };
}
