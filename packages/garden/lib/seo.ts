// The head model: title, description, canonical, robots, Open Graph, Twitter card
// and the JSON-LD graph (WebSite, the publisher, WebPage or ProfilePage,
// BreadcrumbList, Article). A piece first published elsewhere sends search
// engines there (`seo.canonical`).
import { breadcrumbs } from './breadcrumbs.ts';
import { atom } from './dates.ts';
import { byUrl, type SiteEntry } from './entry.ts';
import type { Garden } from './load.ts';
import { absolute, cardUrl, type SiteConfig } from './site.ts';

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;
const TITLE_SEPARATOR = ' | ';
const ROBOTS_DEFAULT = 'max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const CREDIT_LINE = 'This article first appeared';

export type HeadInput = {
  page: SiteEntry | null;
  /** The page's path (never Astro.url: build.format 'file' makes that `/x.html`). */
  path: string;
  site: SiteConfig;
  /** The published entries, for the breadcrumbs and the home page's card. */
  live: SiteEntry[];
  overrides?: { title?: string | null; description?: string | null; noindex?: boolean; ogType?: string | null };
  status?: number;
};

type ShareImage = { url: string; width: number; height: number; alt: string | null };
export type Head = {
  title: string;
  description: string | null;
  canonical: string | null;
  robots: string;
  ogType: string;
  ogTitle: string;
  url: string;
  siteName: string;
  locale: string;
  image: ShareImage | null;
  published: string | null;
  modified: string | null;
  graph: Record<string, unknown>[];
};

const oneOrMany = (values: string[] = []) =>
  values.length === 0 ? undefined : values.length === 1 ? values[0] : values;
const clean = (node: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(node).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)),
  );

/** At most `length` characters, cut at a word, with an ellipsis. */
export function limit(text: string, length: number): string {
  if ([...text].length <= length) return text;
  const cut = [...text].slice(0, length - 1).join('');
  const space = cut.lastIndexOf(' ');
  return (space > 0 ? cut.slice(0, space) : cut).replace(/[ ,.;:–—-]+$/, '') + '…';
}

const home = (site: SiteConfig) => `${site.url.replace(/\/$/, '')}/`;
const websiteId = (site: SiteConfig) => `${home(site)}#website`;
const publisherId = (site: SiteConfig) => `${home(site)}#publisher`;
const isHome = ({ path }: HeadInput) => path === '/';
const isArticle = (page: SiteEntry | null, site: SiteConfig) =>
  page !== null && (site.collections[page.collection]?.article ?? false);

/** The page's title with the site's name after it, unless that runs long. */
export function title(input: HeadInput): string {
  const { page, site, overrides } = input;
  if (page?.seo.title && !overrides?.title) return page.seo.title;
  if (isHome(input) && !overrides?.title) return site.name;
  const own = overrides?.title ?? page?.title ?? null;
  if (own === null) return site.name;
  const full = `${own}${TITLE_SEPARATOR}${site.name}`;
  return [...full].length <= TITLE_MAX ? full : own;
}

export function ogTitle({ page, site, overrides }: HeadInput): string {
  return overrides?.title ?? page?.seo.title ?? page?.title ?? site.name;
}

/** The content's own description: its `description`, a quote note's quote, else the body's first paragraph (skipping a column's credit line). */
export function contentDescription(page: SiteEntry, { skipCreditLine = true } = {}): string | null {
  if (page.description) return page.description;
  if (page.quote) return page.quote;
  const { paragraphs } = page;
  const first = paragraphs[0] ?? null;
  // A republished column opens with its credit line, which describes the outlet: the head skips it, llms.txt does not.
  if (skipCreditLine && first !== null && first.startsWith(CREDIT_LINE))
    return paragraphs.find((p) => !p.startsWith(CREDIT_LINE)) ?? null;
  return first;
}

export function description(input: HeadInput): string | null {
  const { page, site, overrides } = input;
  const text =
    overrides?.description ??
    page?.seo.description ??
    (page ? contentDescription(page) : null) ??
    site.seo.defaultDescription;
  return limit(squish(text), DESCRIPTION_MAX);
}

/** One line: whitespace collapsed. */
export const squish = (text: string): string => text.replace(/\s+/g, ' ').trim();

export const url = ({ site, path }: HeadInput): string => absolute(site.url, path);

export function canonical(input: HeadInput): string | null {
  if ((input.status ?? 200) >= 400) return null;
  return input.page?.seo.canonical ?? url(input);
}

export function robots({ page, overrides, status }: HeadInput): string {
  const noindex = overrides?.noindex ?? page?.seo.noindex ?? false;
  return noindex || (status ?? 200) >= 400 ? 'noindex, follow' : ROBOTS_DEFAULT;
}

/** `profile` on a home page that says so, `article` for a section's articles, else `website`. */
export function ogType(input: HeadInput): string {
  const { page, site, overrides } = input;
  if (overrides?.ogType) return overrides.ogType;
  if (isHome(input)) return page?.seo.og_type === 'profile' ? 'profile' : 'website';
  return page?.seo.og_type ?? (isArticle(page, site) ? 'article' : 'website');
}

/** The share image: the entry's `image`, else the generated card; a listing without an entry shares the home page's. */
export function image(input: HeadInput): ShareImage | null {
  const { page, site, live, status } = input;
  if ((status ?? 200) >= 400) return null;
  if (page?.image)
    return { url: absolute(site.url, page.image.src), width: page.image.width, height: page.image.height, alt: null };
  const subject = page ?? byUrl(live).get('/') ?? null;
  if (!subject) return null;
  return {
    url: absolute(site.url, cardUrl(subject.url)),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    alt: subject.title,
  };
}

function websiteNode(site: SiteConfig) {
  return {
    '@type': 'WebSite',
    '@id': websiteId(site),
    url: home(site),
    name: site.name,
    publisher: { '@id': publisherId(site) },
  };
}

/** Who is behind the site: a Person (with the employers its config names) or an Organization (founded by the other site's Person). */
function publisherNode(site: SiteConfig) {
  const p = site.seo.publisher;
  const person = p.type === 'Person';
  const logo = absolute(site.url, p.logo ?? site.logo);
  const address = clean({
    addressLocality: p.address?.locality,
    addressRegion: p.address?.region,
    addressCountry: p.address?.country,
  });
  const other = site.otherSite;
  const otherId = `${other.url.replace(/\/$/, '')}/#publisher`;
  return clean({
    '@type': p.type,
    '@id': publisherId(site),
    name: p.name ?? site.name,
    alternateName: oneOrMany(p.alternateName),
    legalName: person ? null : p.legalName,
    description: p.description,
    url: home(site),
    logo: person ? null : logo,
    image: person ? logo : null,
    jobTitle: person ? p.jobTitle : null,
    telephone: p.telephone,
    email: p.email,
    address: Object.keys(address).length ? { '@type': 'PostalAddress', ...address } : null,
    areaServed: person ? null : oneOrMany(p.areaServed),
    contactPoint: person
      ? null
      : (p.contactPoints ?? []).map((c) =>
          clean({ '@type': 'ContactPoint', contactType: c.contactType, telephone: c.telephone, email: c.email }),
        ),
    sameAs: p.sameAs,
    worksFor: person ? (p.worksFor ?? []).map((o) => ({ '@type': 'Organization', name: o.name, url: o.url })) : null,
    founder: person ? null : { '@type': 'Person', '@id': otherId, name: other.name, url: other.url },
  });
}

/** The person an article names in its `author` field; one whose page is on a site of the owner's is that site's Person, by its id. */
function authorNodes(page: SiteEntry, site: SiteConfig): Record<string, unknown>[] {
  const author = page.author ? site.authors[page.author] : undefined;
  if (!author) return [];
  const sites = [site.url, site.otherSite.url].map((u) => u.replace(/\/$/, ''));
  const home = author.url ? sites.find((u) => author.url!.startsWith(u)) : undefined;
  return [
    clean({ ...(home ? { '@id': `${home}/#publisher` } : {}), '@type': 'Person', name: author.name, url: author.url }),
  ];
}

function webPageNode(
  input: HeadInput,
  head: { description: string | null; image: ShareImage | null; ogTitle: string; ogType: string },
) {
  const { page, site } = input;
  if (!page) return null;
  const profile = isHome(input) && head.ogType === 'profile';
  return clean({
    '@type': profile ? 'ProfilePage' : 'WebPage',
    '@id': `${url(input)}#webpage`,
    url: url(input),
    name: head.ogTitle,
    description: head.description,
    isPartOf: { '@id': websiteId(site) },
    inLanguage: site.lang,
    primaryImageOfPage: head.image
      ? { '@type': 'ImageObject', url: head.image.url, width: head.image.width, height: head.image.height }
      : null,
    mainEntity: profile ? { '@id': publisherId(site) } : null,
  });
}

function breadcrumbNode(input: HeadInput) {
  const { page, site, live } = input;
  if (!page || isHome(input)) return null;
  const trail = breadcrumbs(page.url, live).map((c, i) => ({
    name: i === 0 ? site.name : c.title,
    item: i === 0 ? home(site) : absolute(site.url, c.url),
  }));
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url(input)}#breadcrumb`,
    itemListElement: trail.map((crumb, i) => ({ '@type': 'ListItem', position: i + 1, ...crumb })),
  };
}

function articleNode(
  input: HeadInput,
  head: { description: string | null; image: ShareImage | null; canonical: string | null },
) {
  const { page, site } = input;
  if (!page || !isArticle(page, site)) return null;
  const people = authorNodes(page, site);
  return clean({
    '@type': 'Article',
    '@id': `${url(input)}#article`,
    headline: page.title,
    description: head.description,
    image: head.image ? [head.image.url] : null,
    datePublished: page.date ? atom(page.date) : null,
    dateModified: page.updated ? atom(page.updated) : null,
    author: people.length ? people : { '@id': publisherId(site) },
    publisher: { '@id': publisherId(site) },
    mainEntityOfPage: { '@id': head.canonical ?? url(input) },
  });
}

export function head(input: HeadInput): Head {
  const { site, page } = input;
  const status = input.status ?? 200;
  const desc = description(input);
  const img = image(input);
  const type = ogType(input);
  const ogT = ogTitle(input);
  const can = canonical(input);
  const article = isArticle(page, site) || type === 'article';
  const graph =
    status >= 400
      ? []
      : [
          websiteNode(site),
          publisherNode(site),
          webPageNode(input, { description: desc, image: img, ogTitle: ogT, ogType: type }),
          breadcrumbNode(input),
          articleNode(input, { description: desc, image: img, canonical: can }),
        ].filter((n): n is Record<string, unknown> => n !== null);
  return {
    title: title(input),
    description: desc,
    canonical: can,
    robots: robots(input),
    ogType: type,
    ogTitle: ogT,
    // A piece first published elsewhere: Open Graph points where rel=canonical does.
    url: can ?? url(input),
    siteName: site.name,
    locale: site.locale,
    image: img,
    published: article && page?.date ? atom(page.date) : null,
    modified: article && page?.updated ? atom(page.updated) : null,
    graph,
  };
}

/** The head for a page of the site (layouts/Layout.astro): an entry's, or a listing's by title and description. */
export function seoFor(
  g: Garden,
  o: {
    page?: SiteEntry | null;
    path: string;
    status?: number;
    title?: string | null;
    description?: string | null;
    noindex?: boolean;
  },
): Head {
  return head({
    page: o.page ?? null,
    path: o.path,
    site: g.site,
    live: g.live,
    status: o.status,
    overrides: { title: o.title, description: o.description, noindex: o.noindex },
  });
}

/** The JSON-LD with `<`, `>` and `&` as \u escapes, so it is safe inside a <script>. */
export function jsonLd(graph: Record<string, unknown>[]): string | null {
  if (graph.length === 0) return null;
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026');
}

/** Whether a page is listed in the sitemap and llms.txt: its own canonical address, indexable, not left out. */
export function inSitemap(page: SiteEntry, site: SiteConfig): boolean {
  if (page.draft || page.seo.noindex || page.seo.sitemap === false) return false;
  const canonical = page.seo.canonical?.replace(/\/$/, '');
  return !canonical || canonical === absolute(site.url, page.url).replace(/\/$/, '');
}
