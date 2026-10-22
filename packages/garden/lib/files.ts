// Loads the project's content and data from disk, for everything that runs
// outside Astro (`npm run check:<site>`, the tests, garden/config.mjs: the
// Markdown pipeline's title index, the sitemap, the redirects). Astro's own
// loader (load.ts) builds the same model from its collections.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import YAML from 'yaml';
import { published, toPages } from './pages.ts';
import type { Author, Collections, NavItem, Page, RawEntry, SiteConfig } from './types.ts';
import { titleIndex, type TitleIndex } from './titles.ts';

export type Project = {
  root: string;
  site: SiteConfig;
  collections: Collections;
  pages: Page[];
  navigation: Record<string, NavItem[]>;
  /** Who writes the articles (src/data/authors.yaml, when the site has any). */
  authors: Author[];
  redirects: { source: string; target: string }[];
  /** The other site's titles (src/data/other-site-titles.json). */
  otherSiteTitles: TitleIndex;
  /** The [[wiki link]] index: this site's published pages over the other site's titles. */
  titles: TitleIndex;
};

const readYaml = <T>(file: string, fallback: T): T =>
  fs.existsSync(file) ? ((YAML.parse(fs.readFileSync(file, 'utf8')) as T) ?? fallback) : fallback;

export function loadProject(root: string): Project {
  const data = (name: string) => path.join(root, 'src/data', name);
  const collections = readYaml<Collections>(data('collections.yaml'), {});
  const site = readYaml<SiteConfig>(data('site.yaml'), {} as SiteConfig);
  const raws: RawEntry[] = [];
  const contentDir = path.join(root, 'src/content');
  for (const collection of Object.keys(collections)) {
    const dir = path.join(contentDir, collection);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .sort()) {
      const parsed = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
      raws.push({ collection, slug: file.slice(0, -3), data: parsed.data, body: parsed.content });
    }
  }
  const navigation: Record<string, NavItem[]> = {};
  for (const [name, nav] of Object.entries(readYaml<Record<string, { items: NavItem[] }>>(data('navigation.yaml'), {})))
    navigation[name] = nav.items ?? [];
  const pages = toPages(raws, collections);
  const otherSiteTitles: TitleIndex = fs.existsSync(data('other-site-titles.json'))
    ? JSON.parse(fs.readFileSync(data('other-site-titles.json'), 'utf8'))
    : {};
  return {
    root,
    site,
    collections,
    pages,
    navigation,
    authors: readYaml<Author[]>(data('authors.yaml'), []),
    redirects: readYaml(data('redirects.yaml'), []),
    otherSiteTitles,
    titles: titleIndex(published(pages), otherSiteTitles),
  };
}
