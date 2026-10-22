import type { APIRoute } from 'astro';
import { wiki } from '../lib/load.ts';
import { robotsTxt } from '../lib/textFiles.ts';

export const GET: APIRoute = async () =>
  new Response(robotsTxt((await wiki()).site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
