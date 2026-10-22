// /robots.txt (lib/textFiles.ts).
import type { APIRoute } from 'astro';
import { garden } from '../lib/load.ts';
import { robotsTxt } from '../lib/textFiles.ts';

export const GET: APIRoute = async () =>
  new Response(robotsTxt((await garden()).site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
