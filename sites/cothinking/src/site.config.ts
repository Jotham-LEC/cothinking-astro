// cothink.ing: what the garden needs to know about the site (the shape is
// garden/lib/site.ts), and the site's own settings: the prices and the terms.
// How to get in touch is lib/contact.ts, which the navigation, the footer and
// the JSON-LD below build on.
import type { SiteConfig } from '@garden/lib/site.ts';
// Relative: astro.config.mjs loads this file before the @site alias exists.
import { businessLine, contact, emailHref, telephone, whatsappHref } from './lib/contact.ts';

export const site = {
  name: 'CoThinking',
  url: 'https://cothink.ing',
  locale: 'en_MY',
  lang: 'en',
  logo: '/images/cothinking/logo.svg',
  logoDark: '/images/cothinking/logo-dark.svg',
  favicon: '/images/cothinking/favicon.svg',
  footerText: businessLine,
  collections: {
    pages: { title: 'CoThinking pages', order: 'order' },
    problems: {
      title: 'Problems I fix',
      landing: 'problem-statements',
      // At the site's root (/emails-going-to-spam), not under the landing page.
      path: '',
      article: true,
      order: 'order',
      graphSection: true,
      graphColour: 2,
    },
    wiki: {
      title: 'Wiki',
      landing: 'wiki',
      article: true,
      order: 'date',
      explorer: 'by-category',
      categories: {
        'choosing-a-provider': 'Choosing a provider',
        'email-and-security': 'Email and security',
        'leads-and-measurement': 'Enquiries and customers',
        search: 'Search and AI visibility',
        'ownership-and-compliance': 'Ownership and compliance',
        'setting-up-it': 'Setting up IT',
      },
      graphSection: true,
      graphColour: 1,
    },
    work: { title: 'Work', landing: 'work', order: 'order', explorer: 'with-body', graphColour: 4 },
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
      { title: 'WhatsApp', url: whatsappHref() },
      { title: 'Get in touch', url: emailHref() },
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
          { title: contact.email, url: `mailto:${contact.email}` },
          { title: 'Send an enquiry', url: emailHref() },
          { title: `WhatsApp: ${contact.phone}`, url: whatsappHref() },
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
  author: {
    name: 'Jotham Lim',
    bio: 'I run CoThinking, a web, IT and marketing service for small businesses in Malaysia. I am also the Head of Global Marketing at Moojing, a China-based market-intelligence company.',
    url: 'https://jothamlim.com/career',
  },
  otherSite: { name: 'Jotham Lim', url: 'https://jothamlim.com', folder: 'jothamlim' },
  seo: {
    defaultDescription:
      'Web, IT and marketing for small businesses in Malaysia, all in one service. Start small, and pay only when you need something done.',
    publisher: {
      type: 'Organization',
      name: 'CoThinking',
      description:
        'Web, IT and marketing for small businesses in Malaysia, all in one service. Start small, and pay only when you need something done.',
      legalName: 'Thinkers Collective Enterprise',
      telephone,
      email: contact.email,
      address: { locality: 'Petaling Jaya', region: 'Selangor', country: 'MY' },
      areaServed: ['Malaysia'],
      contactPoints: [{ contactType: 'customer service', telephone, email: contact.email }],
    },
  },
  marketing: { gtmId: 'GTM-K59BBZ9S' },
} satisfies SiteConfig;

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
