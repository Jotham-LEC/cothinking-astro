// /og/{path}.png: the share card for every page but the home page (og.png.ts),
// drawn at build time for pages without an image of their own, and for the
// rest too, so a page that drops its image keeps a card.
import type { APIRoute, GetStaticPaths } from 'astro';
import { wiki } from '../../wiki/load.ts';
import { cardFor } from '../../wiki/share.ts';
import { renderCard } from '../../wiki/ogCard.ts';

export const getStaticPaths = (async () => {
  const w = await wiki();
  return w.live.filter((p) => p.url !== '/').map((p) => ({ params: { uri: p.url!.slice(1) }, props: { page: p } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const w = await wiki();
  const png = await renderCard(__PROJECT_ROOT__, await cardFor(props.page, w));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
