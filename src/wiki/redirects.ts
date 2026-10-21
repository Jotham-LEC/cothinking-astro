// The static redirects: the content redirects the import wrote (src/data/
// redirects.yaml) and `/blog/{slug}` for every essay, note and publication,
// the old blog's addresses. Astro writes each as a meta-refresh page. A
// redirect to a file (the old PDFs) cannot be one of these: the host does it.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const BLOG_COLLECTIONS = ['essays', 'notes', 'publications'];

export function redirectsFor(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const file = path.join(root, 'src/data/redirects.yaml');
  if (fs.existsSync(file)) {
    for (const r of (YAML.parse(fs.readFileSync(file, 'utf8')) ?? []) as { source: string; target: string }[]) {
      if (!/\.[a-z0-9]+$/i.test(r.source)) out[r.source] = r.target;
    }
  }
  for (const collection of BLOG_COLLECTIONS) {
    const dir = path.join(root, 'src/content', collection);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const slug = name.replace(/\.(md|mdx)$/, '');
      if (slug === name || fs.readFileSync(path.join(dir, name), 'utf8').match(/^draft: true$/m)) continue;
      out[`/blog/${slug}`] ??= `/${collection}/${slug}`;
    }
  }
  return out;
}
