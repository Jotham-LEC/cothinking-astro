import type { APIRoute } from 'astro';
import { wiki } from '@garden/lib/load.ts';
import { llmsTxt } from '@garden/lib/textFiles.ts';

export const GET: APIRoute = async () => {
  const { pages, site, collections, htmlOf } = await wiki();
  return new Response(await llmsTxt(pages, site, collections, htmlOf), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
