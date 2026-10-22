// /og.png: the home page's share card, which listings without an entry share too.
import type { APIRoute } from 'astro';
import { garden } from '../lib/load.ts';
import { home } from '../lib/entry.ts';
import { cardFor } from '../lib/share.ts';
import { renderCard } from '../lib/ogCard.ts';

export const GET: APIRoute = async () => {
  const g = await garden();
  const page = home(g.live);
  if (!page) return new Response(null, { status: 404 });
  const png = await renderCard(cardFor(page, g));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
