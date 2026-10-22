// The essays feed (garden/lib/feed.ts).
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { garden } from '@garden/lib/load.ts';
import { feedOptions } from '@garden/lib/feed.ts';

export const GET: APIRoute = async () => rss(await feedOptions('essays', await garden()));
