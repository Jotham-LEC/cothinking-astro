// RSS 2.0 feeds, as resources/views/feeds/rss.blade.php printed them: the
// whole site (every dated collection) or one section, 20 newest first, each
// item's body through the `feed` parser with absolute URLs, in CDATA.
import { rfc2822 } from './dates.ts';
import { feedOf, reshareOf } from './entry.ts';
import { fullUrls, renderFeed } from './markdown/feed.ts';
import { measure } from './markdown/rehype-images.ts';
import { byDateDesc, published } from './pages.ts';
import type { Collections, Page, SiteConfig } from './types.ts';
import { absolute } from './urls.ts';
import type { TitleIndex } from './titles.ts';

export type FeedContext = {
  site: SiteConfig;
  collections: Collections;
  pages: Page[];
  titles: TitleIndex;
  publicDir?: string;
};

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cdata = (s: string) => `<![CDATA[${s.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;

/** A feed item's body: a note's post (quote, photos, link, video) then its text; any other page's text (and a reshare's original). */
export async function feedBody(page: Page, { pages, titles, site, publicDir }: FeedContext): Promise<string> {
  if (page.collection !== 'notes') {
    const original = reshareOf(page, pages);
    return fullUrls(await renderFeed(`${page.body}\n\n${original?.body ?? ''}`.trim(), titles), site.url);
  }
  const parts: string[] = [];
  const type = page.type ?? 'text';
  if (type === 'quote' && typeof page.data.quote === 'string') {
    const cite =
      typeof page.data.cite === 'string' && page.data.cite !== '' ? `<p>— ${escapeXml(page.data.cite)}</p>` : '';
    parts.push(`<blockquote>\n${await renderFeed(page.data.quote, titles, { breaks: true })}${cite}\n</blockquote>`);
  } else if (type === 'photo' && Array.isArray(page.data.photos)) {
    for (const photo of page.data.photos as string[]) {
      const size = publicDir ? measure(publicDir, photo) : null;
      parts.push(
        `<p><img src="${absolute(site.url, photo)}" alt="" width="${size?.width ?? ''}" height="${size?.height ?? ''}" /></p>`,
      );
    }
  } else if (type === 'link' && typeof page.data.link_url === 'string') {
    const title =
      typeof page.data.link_title === 'string' && page.data.link_title !== ''
        ? page.data.link_title
        : page.data.link_url;
    parts.push(`<p><a href="${escapeXml(page.data.link_url)}">${escapeXml(title)}</a></p>`);
  } else if (type === 'video' && typeof page.data.video_url === 'string') {
    parts.push(`<p><a href="${escapeXml(page.data.video_url)}">${escapeXml(page.data.video_url)}</a></p>`);
  }
  parts.push(await renderFeed(page.body, titles));
  return fullUrls(parts.join('\n'), site.url);
}

export async function rss(section: string | null, ctx: FeedContext): Promise<string> {
  const { site, collections, pages } = ctx;
  const feed = feedOf(section, site, collections);
  const from = section
    ? [section]
    : Object.entries(collections)
        .filter(([, c]) => c.dated)
        .map(([h]) => h)
        .sort();
  const items = byDateDesc(published(pages).filter((p) => from.includes(p.collection))).slice(0, 20);
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(feed.title)}</title>`,
    `    <link>${absolute(site.url, '/')}</link>`,
    `    <description>${escapeXml(feed.title)}</description>`,
    `    <atom:link href="${absolute(site.url, feed.url)}" rel="self" type="application/rss+xml"/>`,
  ];
  for (const item of items) {
    const link = absolute(site.url, item.url!);
    lines.push(
      '    <item>',
      `      <title>${escapeXml(item.title)}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="true">${link}</guid>`,
      `      <pubDate>${item.date ? rfc2822(item.date) : ''}</pubDate>`,
      `      <description>${cdata(await feedBody(item, ctx))}</description>`,
      '    </item>',
    );
  }
  lines.push('  </channel>', '</rss>', '');
  return lines.join('\n');
}
