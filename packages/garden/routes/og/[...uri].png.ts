// /og/{path}.png: the share card for every page but the home page (og.png.ts),
// drawn at build time for pages without an image of their own, and for the
// rest too, so a page that drops its image keeps a card.
import type { APIRoute, GetStaticPaths } from 'astro';
import { garden, site } from '../../lib/load.ts';
import { cardFor } from '../../lib/share.ts';
import { renderCard } from '../../lib/ogCard.ts';

export const getStaticPaths = (async () => {
  const { live } = await garden();
  return live.filter((p) => p.url !== '/').map((p) => ({ params: { uri: p.url.slice(1) }, props: { page: p } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { live } = await garden();
  const png = await renderCard(cardFor(props.page, site, live));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
