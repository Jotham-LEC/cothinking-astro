// @ts-check
import { gardenConfig } from '../../packages/garden/config.mjs';
import { urlOf as otherUrlOf } from '../cothinking/src/lib/urls.ts';
import { urlOf } from './src/lib/urls.ts';
import { site } from './src/site.config.ts';

export default gardenConfig({
  root: new URL('.', import.meta.url),
  site,
  urlOf,
  otherSite: { root: new URL('../cothinking/', import.meta.url), urlOf: otherUrlOf },
  // The old site's addresses and where they go (Astro writes each as a
  // meta-refresh page); /blog/{slug} is src/pages/blog/[slug].astro.
  redirects: {
    '/about': '/',
    '/connect': '/',
    '/cothinking': 'https://cothink.ing',
    '/projects/ultimate-circle': 'https://cothink.ing/work/ultimate-circle',
    '/web-development': '/projects',
  },
});
