// The static redirects: the content redirects the import wrote (src/data/
// redirects.yaml) and `/blog/{slug}` for every published essay, note and
// publication, the old blog's addresses. Astro writes each as a meta-refresh
// page. A redirect from a file address (an old PDF) cannot be one of these;
// the owner chose not to redirect those (AGENTS.md, deviations), so each is
// named in the build log.
import type { Project } from './files.ts';

const BLOG_COLLECTIONS = ['essays', 'notes', 'publications'];

export function redirectsFor({ redirects, pages }: Project): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of redirects) {
    if (/\.[a-z0-9]+$/i.test(r.source)) console.warn(`[redirects] not redirected (a file address): ${r.source} → ${r.target}`);
    else out[r.source] = r.target;
  }
  for (const page of pages) {
    if (page.draft || !page.url || !BLOG_COLLECTIONS.includes(page.collection)) continue;
    out[`/blog/${page.slug}`] ??= page.url;
  }
  return out;
}
