// @ts-check
import { gardenConfig } from '../../packages/garden/config.mjs';

export default gardenConfig({
  root: new URL('.', import.meta.url),
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
