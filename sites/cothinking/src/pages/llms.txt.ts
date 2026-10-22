import type { APIRoute } from 'astro';
import { garden } from '@garden/lib/load.ts';
import { llmsTxt } from '@garden/lib/textFiles.ts';

export const GET: APIRoute = async () => {
  const { live, site } = await garden();
  return new Response(llmsTxt(live, site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
