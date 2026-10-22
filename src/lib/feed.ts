// RSS 2.0 feeds, as the Laravel site's feed view printed them: the whole site
// (every dated collection) or one section, 20 newest first, each item's body
// through the `feed` parser with absolute URLs. @astrojs/rss writes the XML.
import type { RSSOptions } from '@astrojs/rss';
import { feedOf } from './entry.ts';
import { fullUrls, renderFeed } from './markdown/feed.ts';
import { measure } from './markdown/rehype-images.ts';
import { byDateDesc, published } from './pages.ts';
import type { Collections, Page, SiteConfig } from './types.ts';
import { absolute } from './urls.ts';
import type { TitleIndex } from './titles.ts';

type FeedContext = {
  site: SiteConfig;
  collections: Collections;
  pages: Page[];
  titles: TitleIndex;
  publicDir?: string;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A feed item's body: a note's post (quote, photos, link, video) then its text; any other page's text. */
async function feedBody(page: Page, { titles, site, publicDir }: FeedContext): Promise<string> {
  if (page.collection !== 'notes') return fullUrls(await renderFeed(page.body.trim(), titles), site.url);
  const parts: string[] = [];
  const type = page.type ?? 'text';
  if (type === 'quote' && typeof page.data.quote === 'string') {
    const cite =
      typeof page.data.cite === 'string' && page.data.cite !== '' ? `<p>— ${escapeHtml(page.data.cite)}</p>` : '';
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
    parts.push(`<p><a href="${escapeHtml(page.data.link_url)}">${escapeHtml(title)}</a></p>`);
  } else if (type === 'video' && typeof page.data.video_url === 'string') {
    parts.push(`<p><a href="${escapeHtml(page.data.video_url)}">${escapeHtml(page.data.video_url)}</a></p>`);
  }
  parts.push(await renderFeed(page.body, titles));
  return fullUrls(parts.join('\n'), site.url);
}

/** A feed's options for @astrojs/rss: the whole site (every dated collection) or one section, 20 newest first. */
export async function feedOptions(section: string | null, ctx: FeedContext): Promise<RSSOptions> {
  const { site, collections, pages } = ctx;
  const feed = feedOf(section, site, collections);
  const from = section
    ? [section]
    : Object.entries(collections)
        .filter(([, c]) => c.dated)
        .map(([h]) => h);
  const items = byDateDesc(published(pages).filter((p) => from.includes(p.collection))).slice(0, 20);
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
        link: absolute(site.url, item.url!),
        pubDate: item.date ?? undefined,
        description: await feedBody(item, ctx),
      })),
    ),
  };
}
