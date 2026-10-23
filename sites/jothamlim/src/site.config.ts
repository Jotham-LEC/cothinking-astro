// jothamlim.com: what the garden needs to know about the site (the shape is
// garden/lib/site.ts), and the site's own settings.
import type { SiteConfig } from '@garden/lib/site.ts';
// The business line is cothink.ing's, written once there. Relative: astro.config.mjs loads this file before the
// aliases exist.
import { businessLine } from '../../cothinking/src/lib/contact.ts';

export const site = {
  name: 'Jotham Lim',
  url: 'https://jothamlim.com',
  locale: 'en_MY',
  lang: 'en',
  logo: '/media/profile-400.jpg',
  favicon: '/favicon.svg',
  footerText: businessLine,
  collections: {
    pages: { title: 'Pages', order: 'order' },
    essays: { title: 'Essays', landing: 'essays', article: true, feed: true, order: 'date', graphColour: 1 },
    notes: {
      title: 'Notes',
      landing: 'notes',
      article: true,
      feed: true,
      order: 'date',
      explorer: 'by-type',
      types: { text: 'Text', quote: 'Quote' },
      graphColour: 2,
    },
    projects: { title: 'Projects', landing: 'projects', article: true, order: 'date', graphColour: 4 },
    publications: {
      title: 'Publications',
      landing: 'publications',
      article: true,
      order: 'date',
      explorer: 'by-year',
      graphColour: 3,
    },
  },
  navigation: {
    explorer: [
      { title: '🏠 Home', entry: 'pages/home' },
      { title: 'About me', children: [{ entry: 'pages/career' }, { entry: 'pages/cv' }, { entry: 'pages/sports' }] },
      { entry: 'pages/essays' },
      { entry: 'pages/notes' },
      { entry: 'pages/projects' },
      { entry: 'pages/publications' },
    ],
    header: [{ title: 'Work with me', url: 'https://cothink.ing' }],
    footer: [],
  },
  // The old site's addresses and where they go (Astro writes each as a meta-refresh page; the
  // content check confirms each target exists). /blog/{slug} is src/pages/blog/[slug].astro.
  redirects: {
    '/about': '/',
    '/connect': '/',
    '/cothinking': 'https://cothink.ing',
    '/projects/ultimate-circle': 'https://cothink.ing/work/ultimate-circle',
    '/web-development': '/projects',
  },
  otherSite: { name: 'CoThinking', url: 'https://cothink.ing', folder: 'cothinking' },
  seo: {
    defaultDescription:
      "Hi! I'm Jotham, Head of Global Marketing at Moojing, a certified career coach, and I run CoThinking, my web, IT and marketing practice. I write about marketing, tech and work.",
    publisher: {
      type: 'Person',
      alternateName: ['Jotham Lim Ee Chen'],
      jobTitle: 'Head of Global Marketing',
      worksFor: [{ name: 'Moojing', url: 'https://moojing-global.com' }],
      sameAs: ['https://linkedin.com/in/jothamlec', 'https://github.com/Jotham-LEC'],
    },
  },
  marketing: { gtmId: 'GTM-M5NLR7CX' },
} satisfies SiteConfig;

/** A publication's `outlet`, handle → label. */
export const outlets = {
  'the-edge': 'The Edge',
  'property-insight': 'Property Insight',
  'entrepreneur-insight': 'Entrepreneur Insight',
  report: 'Report',
  'press-mentions': 'Press Mentions',
};
