// RSS 2.0 feeds: the whole site (every dated collection) or one section, 20
// newest first, each item's body as the page renders it, with absolute
// URLs. @astrojs/rss writes the XML.
import type { RSSOptions } from '@astrojs/rss';
import { byDateDesc, type SiteEntry } from './entry.ts';
import { feedOf } from './info.ts';
import { absolute, type SiteConfig } from './site.ts';

type FeedContext = { site: SiteConfig; live: SiteEntry[]; htmlOf: (entry: SiteEntry) => Promise<string> };

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Site-relative `href`/`src` made absolute. */
export function fullUrls(html: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return html.replace(/(href|src)="\/(?!\/)/g, `$1="${base}/`);
}

/** A feed item's body: a quote note's quote, then the page's text. */
async function feedBody(page: SiteEntry, { htmlOf, site }: FeedContext): Promise<string> {
  const parts: string[] = [];
  if (page.quote) {
    const cite = page.cite ? `<p>— ${escapeHtml(page.cite)}</p>` : '';
    parts.push(`<blockquote>\n<p>${escapeHtml(page.quote)}</p>${cite}\n</blockquote>`);
  }
  parts.push(await htmlOf(page));
  return fullUrls(parts.join('\n'), site.url);
}

/** A feed's options for @astrojs/rss: the whole site (every dated collection) or one section, 20 newest first. */
export async function feedOptions(section: string | null, ctx: FeedContext): Promise<RSSOptions> {
  const { site, live } = ctx;
  const feed = feedOf(section, site);
  const from = section
    ? [section]
    : Object.entries(site.collections)
        .filter(([, c]) => c.order === 'date')
        .map(([h]) => h);
  const items = byDateDesc(live.filter((p) => from.includes(p.collection))).slice(0, 20);
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
        description: await feedBody(item, ctx),
      })),
    ),
  };
}
