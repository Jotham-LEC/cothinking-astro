// /graph.json: the pages and the links between them, for the local graph in the rail.
import type { APIRoute } from 'astro';
import { wiki } from '@lib/load.ts';

export const GET: APIRoute = async () => {
  const { graph } = await wiki();
  return new Response(JSON.stringify(graph), { headers: { 'Content-Type': 'application/json' } });
};
