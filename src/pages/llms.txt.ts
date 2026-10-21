import type { APIRoute } from 'astro';
import { wiki } from '../wiki/load.ts';
import { llmsTxt } from '../wiki/textFiles.ts';

export const GET: APIRoute = async () => {
  const { pages, site, collections, titles } = await wiki();
  return new Response(await llmsTxt(pages, site, collections, titles), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
