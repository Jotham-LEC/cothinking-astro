// Loads the project's content and data from disk, for everything that runs
// outside Astro (`npm run check`, the tests, the Markdown pipeline's title
// index at config time). Astro's own loader (load.ts) builds the same model
// from its collections.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import YAML from 'yaml';
import { toPages } from './pages.ts';
import type { Author, Collections, NavItem, Page, RawEntry, SiteConfig } from './types.ts';
import type { TitleIndex } from './titles.ts';

export type Project = {
  root: string;
  site: SiteConfig;
  collections: Collections;
  pages: Page[];
  navigation: Record<string, NavItem[]>;
  authors: Author[];
  redirects: { source: string; target: string }[];
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
      .filter((f) => /\.(md|mdx)$/.test(f))
      .sort()) {
      const parsed = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
      raws.push({ collection, slug: file.replace(/\.(md|mdx)$/, ''), data: parsed.data, body: parsed.content });
    }
  }
  const navigation: Record<string, NavItem[]> = {};
  for (const [name, nav] of Object.entries(readYaml<Record<string, { items: NavItem[] }>>(data('navigation.yaml'), {})))
    navigation[name] = nav.items ?? [];
  return {
    root,
    site,
    collections,
    pages: toPages(raws, collections),
    navigation,
    authors: readYaml<Author[]>(data('authors.yaml'), []),
    redirects: readYaml(data('redirects.yaml'), []),
    titles: fs.existsSync(data('titles.json')) ? JSON.parse(fs.readFileSync(data('titles.json'), 'utf8')) : {},
  };
}
