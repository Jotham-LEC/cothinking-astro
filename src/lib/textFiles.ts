// robots.txt, llms.txt and the sitemap's entries, as the Marketing Toolkit addon built
// them: the Marketing settings' disallowed paths and AI crawler rules; the
// site's name and default description, then each collection's listed pages
// (newest change first) as Markdown links with their descriptions; every
// page that is its own canonical address, with its last change (the XML itself is
// @astrojs/sitemap's: src/lib/sitemap.ts).
import { atom } from './dates.ts';
import { naturalCompare } from './natural.ts';
import { published } from './pages.ts';
import { contentDescription, inSitemap, limit } from './seo.ts';
import { plainText } from './markdown/feed.ts';
import type { Collections, Page, SiteConfig } from './types.ts';
import { absolute } from './urls.ts';

/** Where @astrojs/sitemap writes the index (src/lib/sitemap.ts). */
const SITEMAP_PATH = '/sitemap-index.xml';

const AI_TRAINING_AGENTS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'];
const AI_SEARCH_AGENTS = ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot'];

const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x !== '') : [];

export function robotsTxt(site: SiteConfig): string {
  const m = site.marketing;
  const lines = ['User-agent: *'];
  for (const path of list(m.robots_disallow).length ? list(m.robots_disallow) : ['/cp/'])
    lines.push(`Disallow: ${path}`);
  const agents = [
    ...(m.allow_ai_training === false ? AI_TRAINING_AGENTS : []),
    ...(m.allow_ai_search === false ? AI_SEARCH_AGENTS : []),
  ];
  if (agents.length) lines.push('', ...agents.map((a) => `User-agent: ${a}`), 'Disallow: /');
  if (typeof m.robots_extra === 'string' && m.robots_extra.trim() !== '') lines.push('', m.robots_extra.trim());
  lines.push('', `Sitemap: ${site.url}${SITEMAP_PATH}`);
  return lines.join('\n') + '\n';
}

export function sitemapEntries(pages: Page[], site: SiteConfig): { loc: string; lastmod: string | null }[] {
  return published(pages)
    .filter((p) => inSitemap(p, site))
    .map((p) => ({ loc: absolute(site.url, p.url), lastmod: p.updated ? atom(p.updated) : null }))
    .sort((a, b) => a.loc.localeCompare(b.loc));
}

export async function llmsTxt(
  pages: Page[],
  site: SiteConfig,
  collections: Collections,
  htmlOf: (page: Page) => Promise<string>,
  perCollection = 100,
): Promise<string> {
  const lines = [`# ${site.name}`, ''];
  if (typeof site.seo.default_description === 'string' && site.seo.default_description.trim() !== '')
    lines.push(`> ${plainText(site.seo.default_description)}`, '');
  const live = published(pages).filter((p) => inSitemap(p, site));
  const handles = Object.keys(collections).sort((a, b) => collections[a]!.title.localeCompare(collections[b]!.title));
  for (const handle of handles) {
    const entries = live
      .filter((p) => p.collection === handle)
      .sort((a, b) => (b.updated?.getTime() ?? 0) - (a.updated?.getTime() ?? 0) || naturalCompare(a.title, b.title))
      .slice(0, perCollection);
    if (entries.length === 0) continue;
    lines.push(`## ${collections[handle]!.title}`, '');
    for (const page of entries) {
      const text = page.seo.description ?? contentDescription(page, await htmlOf(page), { skipCreditLine: false });
      const description = text ? limit(plainText(text), 200) : null;
      lines.push(
        `- [${page.title.replace(/\[/g, '(').replace(/\]/g, ')')}](${absolute(site.url, page.url)})${description ? `: ${description}` : ''}`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}
