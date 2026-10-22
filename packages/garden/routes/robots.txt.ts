// /robots.txt (lib/textFiles.ts).
import type { APIRoute } from 'astro';
import { robotsTxt } from '../lib/textFiles.ts';
import { site } from '../lib/load.ts';

export const GET: APIRoute = async () =>
  new Response(robotsTxt(site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
