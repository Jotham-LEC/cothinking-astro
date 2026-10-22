// /og.png: the home page's share card, which listings without an entry share too.
import type { APIRoute } from 'astro';
import { wiki } from '@lib/load.ts';
import { cardFor } from '@lib/share.ts';
import { renderCard } from '@lib/ogCard.ts';
import { home } from '@lib/pages.ts';
import { projectRoot } from '@lib/paths.ts';

export const GET: APIRoute = async () => {
  const w = await wiki();
  const page = home(w.live);
  if (!page) return new Response(null, { status: 404 });
  const png = await renderCard(projectRoot, await cardFor(page, w));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
