// The notes feed (garden/lib/feed.ts).
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { garden } from '@garden/lib/load.ts';
import { feedOptions } from '@garden/lib/feed.ts';
import { site } from '@site/site.config.ts';

export const GET: APIRoute = async () => rss(await feedOptions('notes', site, await garden()));
