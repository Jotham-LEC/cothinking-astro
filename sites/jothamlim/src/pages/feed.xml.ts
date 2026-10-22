// The site feed (garden/lib/feed.ts).
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { wiki } from '@garden/lib/load.ts';
import { feedOptions } from '@garden/lib/feed.ts';

export const GET: APIRoute = async () => rss(await feedOptions(null, await wiki()));
