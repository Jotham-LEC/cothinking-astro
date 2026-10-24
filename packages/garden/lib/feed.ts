// RSS 2.0 feeds: the whole site (every dated collection) or one section, 20
// newest first, each item's body as the page renders it, with absolute
// URLs and without what only works on the page (the dark-mode twin of a
// picture, the code blocks' copy buttons). @astrojs/rss writes the XML.
import type { RSSOptions } from '@astrojs/rss';
import { sortNewestFirst, type SiteEntry } from './entry.ts';
import { feedOf } from './pageInfo.ts';
import { absolute, type SiteConfig } from './site.ts';

/** What a feed reads off `garden()`: the published entries and each one's rendered body. */
type FeedContext = { live: SiteEntry[]; htmlOf: (entry: SiteEntry) => Promise<string> };

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Site-relative `href`, `src` and `srcset` made absolute, and `#x` links pointed at the page (`pageUrl#x`). */
export function fullUrls(html: string, siteUrl: string, pageUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return html
    .replace(/(href|src)="\/(?!\/)/g, `$1="${base}/`)
    .replace(/href="#/g, `href="${pageUrl}#`)
    .replace(/srcset="([^"]*)"/g, (_, set: string) => `srcset="${set.replace(/(^|,\s*)\/(?!\/)/g, `$1${base}/`)}"`);
}

/** What only works on the page: a picture's dark-mode twin (`wiki-logo-dark`), a code block's copy button. */
export const pageOnly = (html: string): string =>
  html
    .replace(/<img\b[^>]*\bclass="[^"]*\bwiki-logo-dark\b[^"]*"[^>]*>/g, '')
    .replace(/<button\b[^>]*\bclass="[^"]*\bcode-block-copy\b[^"]*"[^>]*>[\s\S]*?<\/button>/g, '');

/** A feed item's body: a quote note's quote, then the page's text. */
async function feedBody(page: SiteEntry, site: SiteConfig, { htmlOf }: FeedContext): Promise<string> {
  const parts: string[] = [];
  if (page.quote) {
    const cite = page.cite ? `<p>— ${escapeHtml(page.cite)}</p>` : '';
    parts.push(`<blockquote>\n<p>${escapeHtml(page.quote)}</p>${cite}\n</blockquote>`);
  }
  parts.push(pageOnly(await htmlOf(page)));
  return fullUrls(parts.join('\n'), site.url, absolute(site.url, page.url));
}

/** A feed's options for @astrojs/rss: the whole site (every dated collection) or one section, 20 newest first. */
export async function feedOptions(section: string | null, site: SiteConfig, ctx: FeedContext): Promise<RSSOptions> {
  const { live } = ctx;
  const feed = feedOf(section, site);
  const from = section
    ? [section]
    : Object.entries(site.collections)
        .filter(([, c]) => c.order === 'date')
        .map(([h]) => h);
  const items = sortNewestFirst(live.filter((p) => from.includes(p.collection))).slice(0, 20);
  return {
    title: feed.title,
    description: feed.title,
    site: absolute(site.url, '/'),
    trailingSlash: false,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<atom:link href="${absolute(site.url, feed.url)}" rel="self" type="application/rss+xml"/>`,
    items: await Promise.all(
      items.map(async (item) => ({
        title: item.title,
        link: absolute(site.url, item.url),
        pubDate: item.date ?? undefined,
        description: await feedBody(item, site, ctx),
      })),
    ),
  };
}
