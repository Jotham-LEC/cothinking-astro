// cothink.ing: what the garden needs to know about the site (the shape is
// garden/lib/site.ts), and the site's own settings: how to get in touch,
// the prices and the terms.
import type { SiteConfig } from '@garden/lib/site.ts';

export const site = {
  name: 'CoThinking',
  url: 'https://cothink.ing',
  locale: 'en_MY',
  lang: 'en',
  logo: '/images/cothinking/logo.svg',
  logoDark: '/images/cothinking/logo-dark.svg',
  favicon: '/images/cothinking/favicon.svg',
  footerText:
    'Thinkers Collective Enterprise (trading as CoThinking), Petaling Jaya, Selangor · SSM 202503229808 (PG0575749-P) · WhatsApp: 017-642 1337',
  collections: {
    pages: { title: 'CoThinking pages', order: 'order' },
    problems: {
      title: 'Problems I fix',
      landing: 'problem-statements',
      article: true,
      order: 'order',
      graphSection: true,
      graphColour: 'notes',
    },
    wiki: {
      title: 'Wiki',
      landing: 'wiki',
      article: true,
      order: 'date',
      groupBy: 'category',
      categories: {
        'choosing-a-provider': 'Choosing a provider',
        'email-and-security': 'Email and security',
        'leads-and-measurement': 'Enquiries and customers',
        search: 'Search and AI visibility',
        'ownership-and-compliance': 'Ownership and compliance',
        'setting-up-it': 'Setting up IT',
      },
      graphSection: true,
      graphColour: 'essays',
    },
    work: { title: 'Work', landing: 'work', order: 'order', explorer: 'with-body', graphColour: 'projects' },
  },
  navigation: {
    explorer: [
      { title: 'Home', entry: 'pages/home' },
      { entry: 'pages/problem-statements' },
      { entry: 'pages/websites' },
      { entry: 'pages/how-i-work' },
      { entry: 'pages/work' },
      { entry: 'pages/wiki' },
    ],
    header: [
      { title: 'Problems I fix', entry: 'pages/problem-statements' },
      { entry: 'pages/websites' },
      { entry: 'pages/how-i-work' },
      { entry: 'pages/work' },
      { entry: 'pages/wiki' },
      { title: 'WhatsApp', url: 'https://wa.me/60176421337?text=Hi%20Jotham%2C%20I%20found%20you%20on%20cothink.ing.' },
      { title: 'Get in touch', url: 'mailto:jotham@cothink.ing?subject=Enquiry%20from%20cothink.ing' },
    ],
    footer: [
      {
        title: 'CoThinking',
        children: [
          { title: 'Problems I fix', entry: 'pages/problem-statements' },
          { entry: 'pages/websites' },
          { entry: 'pages/how-i-work' },
          { entry: 'pages/work' },
          { entry: 'pages/wiki' },
          { entry: 'pages/privacy' },
        ],
      },
      {
        title: 'Get in touch',
        children: [
          { title: 'jotham@cothink.ing', url: 'mailto:jotham@cothink.ing' },
          { title: 'Send an enquiry', url: 'mailto:jotham@cothink.ing?subject=Enquiry%20from%20cothink.ing' },
          {
            title: 'WhatsApp: 017-642 1337',
            url: 'https://wa.me/60176421337?text=Hi%20Jotham%2C%20I%20found%20you%20on%20cothink.ing.',
          },
        ],
      },
      {
        title: 'Elsewhere',
        children: [
          { title: 'jothamlim.com', url: 'https://jothamlim.com/career' },
          { title: 'LinkedIn', url: 'https://linkedin.com/in/jothamlec' },
        ],
      },
    ],
  },
  // The old site's addresses and where they go (Astro writes each as a meta-refresh page; the
  // content check confirms each target exists).
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
  authors: {
    'jotham-lim': {
      name: 'Jotham Lim',
      bio: 'I run CoThinking, a web, IT and marketing service for small businesses in Malaysia. I am also the Head of Global Marketing at Moojing, a China-based market-intelligence company.',
      url: 'https://jothamlim.com/career',
    },
  },
  otherSite: { name: 'Jotham Lim', url: 'https://jothamlim.com' },
  seo: {
    defaultDescription:
      'Web, IT and marketing for small businesses in Malaysia, all in one service. Start small, and pay only when you need something done.',
    twitterHandle: 'Jotham_LEC_',
    publisher: {
      type: 'Organization',
      name: 'CoThinking',
      description:
        'Web, IT and marketing for small businesses in Malaysia, all in one service. Start small, and pay only when you need something done.',
      legalName: 'Thinkers Collective Enterprise',
      telephone: '+60 17-642 1337',
      email: 'jotham@cothink.ing',
      address: { locality: 'Petaling Jaya', region: 'Selangor', country: 'MY' },
      areaServed: ['Malaysia'],
      contactPoints: [{ contactType: 'customer service', telephone: '+60 17-642 1337', email: 'jotham@cothink.ing' }],
    },
  },
  marketing: { gtmId: 'GTM-K59BBZ9S', robotsDisallow: ['/cp/'], allowAiTraining: true, allowAiSearch: true },
} satisfies SiteConfig;

/** How to get in touch: the views write mailto: and wa.me links from these (src/lib/contact.ts). */
export const contact = { email: 'jotham@cothink.ing', whatsappNumber: '60176421337', whatsappDisplay: '017-642 1337' };

/** Prices in RM, as printed by the Websites and How I work pages. */
export const prices = {
  starter: 3900,
  starterList: 6500,
  complete: 5900,
  completeList: 9900,
  carePlanCore: 130,
  carePlanComplete: 230,
};

/** The Terms of Service the How I work page summarises. */
export const terms = { version: 3, date: '2026-10-20' };
