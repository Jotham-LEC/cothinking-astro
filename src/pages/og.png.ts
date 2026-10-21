// /og.png: the home page's share card, which listings without an entry share too.
import type { APIRoute } from 'astro';
import { wiki } from '../wiki/load.ts';
import { cardFor } from '../wiki/share.ts';
import { renderCard } from '../wiki/ogCard.ts';
import { home } from '../wiki/pages.ts';

export const GET: APIRoute = async () => {
  const w = await wiki();
  const page = home(w.live);
  if (!page) return new Response(null, { status: 404 });
  const png = await renderCard(__PROJECT_ROOT__, await cardFor(page, w));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
