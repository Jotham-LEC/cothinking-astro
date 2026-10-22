// The site feed (garden/lib/feed.ts).
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { garden, site } from '../lib/load.ts';
import { feedOptions } from '../lib/feed.ts';

export const GET: APIRoute = async () => rss(await feedOptions(null, site, await garden()));
