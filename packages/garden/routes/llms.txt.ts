// /llms.txt: the site for language models (lib/textFiles.ts).
import type { APIRoute } from 'astro';
import { garden, site } from '../lib/load.ts';
import { llmsTxt } from '../lib/textFiles.ts';

export const GET: APIRoute = async () => {
  const { live } = await garden();
  return new Response(llmsTxt(live, site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
