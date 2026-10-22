// What a page's generated share card says (App\Og\CardTemplate): the section
// it sits in (or the site's host for a root page) as the label, its title,
// its description, the site's name, and the author's portrait.
import type { Wiki } from './load.ts';
import { isChild } from './pages.ts';
import { description, ogTitle } from './seo.ts';
import type { LivePage } from './types.ts';
import type { CardInput } from './ogCard.ts';

/** The author's portrait on every card, on both sites (config('site.logo') in the Laravel app). */
const PORTRAIT = '/media/profile-400.jpg';

export async function cardFor(page: LivePage, w: Wiki): Promise<CardInput> {
  const { site, collections } = w;
  const section = isChild(page, collections) ? (collections[page.collection]?.title ?? null) : null;
  const html = await w.htmlOf(page);
  const input = { page, path: page.url, site, collections, pages: w.live, html };
  return {
    label: section ?? new URL(site.url).host,
    title: ogTitle(input),
    description: description(input),
    url: site.name,
    portrait: PORTRAIT,
  };
}
