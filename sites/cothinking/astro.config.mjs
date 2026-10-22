// @ts-check
import { gardenConfig } from '../../packages/garden/config.mjs';
import { urlOf as otherUrlOf } from '../jothamlim/src/lib/urls.ts';
import { urlOf } from './src/lib/urls.ts';
import { site } from './src/site.config.ts';

export default gardenConfig({
  root: new URL('.', import.meta.url),
  site,
  urlOf,
  otherSite: { root: new URL('../jothamlim/', import.meta.url), urlOf: otherUrlOf },
  // The old site's addresses and where they go (Astro writes each as a meta-refresh page).
  redirects: {
    '/articles': '/wiki',
    '/clients': '/work',
    '/jotham-lim': 'https://jothamlim.com/career',
    '/marketing': '/#problems',
    '/operations': '/#problems',
    '/web-development': '/websites',
    '/wiki/why-i-bill-by-the-hour': '/how-i-work',
    '/wiki/why-i-quote-a-fixed-price': '/how-i-work',
    '/wiki/utm-naming-convention': 'https://jothamlim.com/essays/utm-naming-convention',
    '/wiki/whatsapp-to-crm': 'https://jothamlim.com/essays/whatsapp-to-crm',
    '/wiki/what-is-geo': '/wiki/appearing-in-google-and-ai-search',
  },
});
