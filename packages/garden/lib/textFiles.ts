// robots.txt, llms.txt and the sitemap's entries: the marketing config's
// disallowed paths and AI crawler rules; the site's name and default
// description, then each collection's listed pages (newest change first) as
// Markdown links with their descriptions; every page that is its own
// canonical address, with its last change (the XML itself is
// @astrojs/sitemap's: sitemap.ts).
import { atom } from './dates.ts';
import { published, type SiteEntry } from './entry.ts';
import { naturalCompare } from './natural.ts';
import { contentDescription, inSitemap, limit, squish } from './seo.ts';
import { absolute, type SiteConfig } from './site.ts';

/** Where @astrojs/sitemap writes the index (sitemap.ts). */
const SITEMAP_PATH = '/sitemap-index.xml';

const AI_TRAINING_AGENTS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'];
const AI_SEARCH_AGENTS = ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot'];

export function robotsTxt(site: SiteConfig): string {
  const m = site.marketing;
  const lines = ['User-agent: *'];
  for (const path of m.robotsDisallow) lines.push(`Disallow: ${path}`);
  const agents = [...(m.allowAiTraining ? [] : AI_TRAINING_AGENTS), ...(m.allowAiSearch ? [] : AI_SEARCH_AGENTS)];
  if (agents.length) lines.push('', ...agents.map((a) => `User-agent: ${a}`), 'Disallow: /');
  lines.push('', `Sitemap: ${site.url}${SITEMAP_PATH}`);
  return lines.join('\n') + '\n';
}

export function sitemapEntries(entries: SiteEntry[], site: SiteConfig): { loc: string; lastmod: string | null }[] {
  return published(entries)
    .filter((p) => inSitemap(p, site))
    .map((p) => ({ loc: absolute(site.url, p.url), lastmod: p.updated ? atom(p.updated) : null }))
    .sort((a, b) => a.loc.localeCompare(b.loc));
}

export function llmsTxt(live: SiteEntry[], site: SiteConfig, perCollection = 100): string {
  const lines = [`# ${site.name}`, ''];
  lines.push(`> ${squish(site.seo.defaultDescription)}`, '');
  const listed = live.filter((p) => inSitemap(p, site));
  const handles = Object.keys(site.collections).sort((a, b) =>
    site.collections[a]!.title.localeCompare(site.collections[b]!.title),
  );
  for (const handle of handles) {
    const entries = listed
      .filter((p) => p.collection === handle)
      .sort((a, b) => (b.updated?.getTime() ?? 0) - (a.updated?.getTime() ?? 0) || naturalCompare(a.title, b.title))
      .slice(0, perCollection);
    if (entries.length === 0) continue;
    lines.push(`## ${site.collections[handle]!.title}`, '');
    for (const page of entries) {
      const text = page.seo.description ?? contentDescription(page, { skipCreditLine: false });
      const description = text ? limit(squish(text), 200) : null;
      lines.push(
        `- [${page.title.replace(/\[/g, '(').replace(/\]/g, ')')}](${absolute(site.url, page.url)})${description ? `: ${description}` : ''}`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}
