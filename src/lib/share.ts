// What a page's generated share card says (App\Og\CardTemplate): the section
// it sits in (or the site's host for a root page) as the label, its title,
// its description, the site's name, and the author's portrait.
import type { Wiki } from './load.ts';
import { renderFeed } from './markdown/feed.ts';
import { isChild } from './pages.ts';
import { description, ogTitle } from './seo.ts';
import type { Page } from './types.ts';
import type { CardInput } from './ogCard.ts';

export async function cardFor(page: Page, w: Wiki): Promise<CardInput> {
  const { site, collections } = w;
  const section = isChild(page, collections) ? (collections[page.collection]?.title ?? null) : null;
  const html = await renderFeed(page.body, w.titles, { callouts: true });
  const input = { page, path: page.url!, site, collections, pages: w.live, html };
  return {
    label: section ?? new URL(site.url).host,
    title: page.seo.og_title ?? ogTitle(input),
    description: page.seo.og_description ?? description(input),
    url: site.name,
    portrait: site.attributes.logo ?? null,
  };
}

/** The card's address: /og.png for the home page, /og/{path}.png for the rest. */
export const cardUrl = (page: Page): string => (page.url === '/' ? '/og.png' : `/og${page.url}.png`);
