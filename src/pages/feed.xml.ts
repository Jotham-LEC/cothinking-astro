// The site feed (src/lib/feed.ts).
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { wiki } from '../lib/load.ts';
import { feedOptions } from '../lib/feed.ts';
import { publicDir } from '../lib/paths.ts';

export const GET: APIRoute = async () => rss(await feedOptions(null, { ...(await wiki()), publicDir }));
