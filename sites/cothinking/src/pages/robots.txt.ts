import type { APIRoute } from 'astro';
import { wiki } from '@garden/lib/load.ts';
import { robotsTxt } from '@garden/lib/textFiles.ts';

export const GET: APIRoute = async () =>
  new Response(robotsTxt((await wiki()).site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
