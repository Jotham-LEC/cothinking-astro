import type { APIRoute } from 'astro';
import { wiki } from '../../wiki/load.ts';
import { rss } from '../../wiki/feed.ts';

export const GET: APIRoute = async () => {
  const w = await wiki();
  return new Response(await rss('essays', { ...w, publicDir: __PROJECT_ROOT__ + 'public' }), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
