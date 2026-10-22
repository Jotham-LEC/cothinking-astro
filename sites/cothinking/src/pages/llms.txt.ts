import type { APIRoute } from 'astro';
import { garden } from '@garden/lib/load.ts';
import { llmsTxt } from '@garden/lib/textFiles.ts';

export const GET: APIRoute = async () => {
  const { live, site, htmlOf } = await garden();
  return new Response(await llmsTxt(live, site, htmlOf), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
