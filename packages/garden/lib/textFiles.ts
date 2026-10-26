// robots.txt and llms.txt: every crawler welcome, and where the sitemap is
// (sitemap.ts); the site's name and default description, then each
// collection's listed pages (newest change first) as Markdown links with
// their descriptions; to a page's Markdown copy where it has one.
import { descriptionOf, type SiteEntry } from './entry.ts';
import { naturalCompare } from './natural.ts';
import { markdownUrlOf } from './pageInfo.ts';
import { inSitemap, limit, squish } from './seo.ts';
import { absolute, type SiteConfig } from './site.ts';

/** Where @astrojs/sitemap writes the index (sitemap.ts). */
const SITEMAP_PATH = '/sitemap-index.xml';

export const robotsTxt = (site: SiteConfig): string =>
  `User-agent: *\nAllow: /\n\nSitemap: ${site.url}${SITEMAP_PATH}\n`;

/** The most pages llms.txt lists per collection. */
const PER_COLLECTION = 100;

export function llmsTxt(live: SiteEntry[], site: SiteConfig): string {
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
      .slice(0, PER_COLLECTION);
    if (entries.length === 0) continue;
    lines.push(`## ${site.collections[handle]!.title}`, '');
    for (const page of entries) {
      // A column's credit line says where it first appeared, which a reader of llms.txt wants.
      const text = descriptionOf(page, { skipCreditLine: false });
      const description = text ? limit(squish(text), 200) : null;
      lines.push(
        `- [${page.title.replace(/\[/g, '(').replace(/\]/g, ')')}](${absolute(site.url, markdownUrlOf(page, site) ?? page.url)})${description ? `: ${description}` : ''}`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}
