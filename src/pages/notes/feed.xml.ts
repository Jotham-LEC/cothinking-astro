import type { APIRoute } from 'astro';
import { wiki } from '../../lib/load.ts';
import { rss } from '../../lib/feed.ts';
import { publicDir } from '../../lib/paths.ts';

export const GET: APIRoute = async () => {
  const w = await wiki();
  return new Response(await rss('notes', { ...w, publicDir }), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
