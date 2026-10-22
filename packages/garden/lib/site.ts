// What a site tells the garden about itself: `sites/<site>/src/site.config.ts`
// exports one of these (`satisfies SiteConfig`). Nothing here names a site.

export type NavItem = {
  title?: string;
  /** An entry, as `collection/id` (`pages/essays`); its title is the item's unless `title` is set. */
  entry?: string;
  url?: string;
  children?: NavItem[];
};

export type Author = { name: string; bio?: string; url?: string };

export type CollectionConfig = {
  title: string;
  /** The `pages` entry the collection hangs under: a section's landing page. Absent for `pages` itself. */
  landing?: string;
  /** The pages are articles: `og:type` article and a JSON-LD Article node. */
  article?: boolean;
  /** The section has its own feed at /<collection>/feed.xml. */
  feed?: boolean;
  /** How listings order the pages: newest first, or by their `order` field. */
  order: 'date' | 'order';
  /** The Explorer lists only the pages with a body. */
  explorer?: 'with-body';
  /** The Explorer groups the pages by year, or by their `category` (`categories`, in order). */
  groupBy?: 'year' | 'category';
  categories?: Record<string, string>;
  /** Post types (a note's `type`), handle → title; the Explorer lists a row per type in use. */
  types?: Record<string, string>;
  /** The landing page's graph holds the whole section, not only its neighbours. */
  graphSection?: boolean;
  /** The graph's colour for the pages: a `--site-graph-*` token (garden/styles/tokens.css); `pages` otherwise. */
  graphColour?: 'essays' | 'notes' | 'publications' | 'projects' | 'pages';
};

export type SiteConfig = {
  name: string;
  url: string;
  /** `en_MY`: Open Graph's locale. */
  locale: string;
  lang: string;
  /** Public paths: the logo (a portrait, or a wordmark with its dark twin) and the favicon. */
  logo: string;
  logoDark?: string;
  favicon: string;
  footerText: string;
  collections: Record<string, CollectionConfig>;
  navigation: { explorer: NavItem[]; header: NavItem[]; footer: NavItem[] };
  /** Who writes the articles (an entry's `author`), by id. */
  authors: Record<string, Author>;
  /** The owner's other site: `[[wiki links]]` reach its pages, and the JSON-LD names it. */
  otherSite: { name: string; url: string };
  seo: {
    defaultDescription: string;
    twitterHandle?: string;
    /** Who is behind the site, for the JSON-LD: a Person or an Organization. */
    publisher: {
      type: 'Person' | 'Organization';
      name?: string;
      alternateName?: string[];
      description?: string;
      legalName?: string;
      /** A public path: a Person's image, an Organization's logo (else the site's logo). */
      logo?: string;
      jobTitle?: string;
      telephone?: string;
      email?: string;
      address?: { locality?: string; region?: string; country?: string };
      areaServed?: string[];
      contactPoints?: { contactType: string; telephone?: string; email?: string }[];
      sameAs?: string[];
    };
  };
  marketing: {
    gtmId?: string;
    robotsDisallow: string[];
    allowAiTraining: boolean;
    allowAiSearch: boolean;
  };
};

/** The absolute address of a path on a site; the home page is the bare site URL. */
export function absolute(siteUrl: string, path: string): string {
  return siteUrl.replace(/\/$/, '') + (path === '/' ? '' : path);
}

/** Whether an address leaves the site: http(s) on another host. */
export function isExternal(href: string, siteUrl: string): boolean {
  try {
    const url = new URL(href);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.host !== new URL(siteUrl).host;
  } catch {
    return false;
  }
}

/** An address's path, so a relative and an absolute address to one page match. */
export function pathOf(url: string): string {
  const path = url.startsWith('http') ? new URL(url).pathname : url.split(/[?#]/)[0]!;
  return path.replace(/\/$/, '') || '/';
}

/** A page's share card (og.png.ts, og/[...uri].png.ts): /og.png for the home page, /og/{path}.png for the rest. */
export const cardUrl = (path: string): string => (path === '/' ? '/og.png' : `/og${path}.png`);
