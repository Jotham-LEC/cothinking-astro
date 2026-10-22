// The head model: what the Marketing Toolkit addon and App\Seo printed for a
// page. Title, description, canonical, robots, Open Graph, Twitter and the
// JSON-LD graph (WebSite, the publisher, WebPage or ProfilePage,
// BreadcrumbList, Article, the editors' extra nodes).
import { breadcrumbs } from './breadcrumbs.ts';
import { atom } from './dates.ts';
import { plainText } from './markdown/feed.ts';
import { measure } from './markdown/rehype-images.ts';
import { byUrl } from './pages.ts';
import type { Collections, Page, SiteConfig } from './types.ts';
import { absolute, cardUrl } from './urls.ts';

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;
const ROBOTS_DEFAULT = 'max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const CREDIT_LINE = 'This article first appeared';

export type HeadInput = {
  page: Page | null;
  /** The page's path (never Astro.url: build.format 'file' makes that `/x.html`). */
  path: string;
  site: SiteConfig;
  collections: Collections;
  pages: Page[];
  /** The rendered body, for a description from its first paragraph. */
  html?: string;
  /** Where the public files are, to measure a share image. */
  publicDir?: string;
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
  twitterSite: string | null;
  graph: Record<string, unknown>[];
};

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x !== '') : [];
const oneOrMany = (values: string[]) => (values.length === 0 ? undefined : values.length === 1 ? values[0] : values);
const clean = (node: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(node).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)),
  );

/** At most `length` characters, cut at a word, with an ellipsis (the addon's Text::limit). */
export function limit(text: string, length: number): string {
  if ([...text].length <= length) return text;
  const cut = [...text].slice(0, length - 1).join('');
  const space = cut.lastIndexOf(' ');
  return (space > 0 ? cut.slice(0, space) : cut).replace(/[ ,.;:–—-]+$/, '') + '…';
}

const home = (site: SiteConfig) => `${site.url.replace(/\/$/, '')}/`;
const websiteId = (site: SiteConfig) => `${home(site)}#website`;
const publisherId = (site: SiteConfig) => `${home(site)}#publisher`;

function separator(site: SiteConfig): string {
  const sep = (str(site.seo.title_separator) ?? '·').trim();
  return ` ${sep} `;
}

const isHome = ({ path }: HeadInput) => path === '/';

export function title(input: HeadInput): string {
  const { page, site, overrides } = input;
  if (page?.seo.title) return page.seo.title;
  if (isHome(input) && !overrides?.title) return site.name;
  const own = overrides?.title ?? page?.title ?? null;
  if (own === null) return site.name;
  if (site.seo.title_site_name === false || (site.seo.title_site_name === undefined && !str(site.seo.title_separator)))
    return own;
  const full = `${own}${separator(site)}${str(site.seo.title_brand) ?? site.name}`;
  return [...full].length <= TITLE_MAX ? full : own;
}

export function ogTitle({ page, site, overrides }: HeadInput): string {
  return overrides?.title ?? page?.seo.title ?? page?.title ?? site.name;
}

/** The content's own description: its `description`, a quote note's quote, else the body's first paragraph (skipping a column's credit line). */
export function contentDescription(page: Page, html?: string, { skipCreditLine = true } = {}): string | null {
  if (page.description) return page.description;
  if (typeof page.data.quote === 'string' && page.data.quote.trim() !== '') return plainText(page.data.quote);
  if (!html) return null;
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => plainText(m[1]!))
    .filter((p) => p !== '');
  const first = paragraphs[0] ?? null;
  // A republished column opens with its credit line, which describes the outlet: the head skips it (App\Seo), llms.txt did not.
  if (skipCreditLine && first !== null && first.startsWith(CREDIT_LINE))
    return paragraphs.find((p) => !p.startsWith(CREDIT_LINE)) ?? null;
  return first;
}

export function description(input: HeadInput): string | null {
  const { page, site, html, overrides } = input;
  const text =
    overrides?.description ??
    page?.seo.description ??
    (page ? contentDescription(page, html) : null) ??
    str(site.seo.default_description);
  return text === null ? null : limit(plainText(text), DESCRIPTION_MAX);
}

export const url = ({ site, path }: HeadInput): string => absolute(site.url, path);

export function canonical(input: HeadInput): string | null {
  if ((input.status ?? 200) >= 400) return null;
  return input.page?.seo.canonical || url(input);
}

export function robots({ page, overrides, status }: HeadInput): string {
  const noindex = overrides?.noindex ?? page?.seo.noindex ?? false;
  const nofollow = page?.seo.nofollow ?? false;
  if (noindex || (status ?? 200) >= 400) return `noindex, ${nofollow ? 'nofollow' : 'follow'}`;
  let rules = ROBOTS_DEFAULT;
  if (page?.seo.nosnippet) rules = rules.replace(/max-snippet:-?\d+/, 'nosnippet');
  else if (typeof page?.seo.max_snippet === 'number' && page.seo.max_snippet >= 0)
    rules = rules.replace(/max-snippet:-?\d+/, `max-snippet:${page.seo.max_snippet}`);
  return [nofollow ? 'nofollow' : null, rules].filter(Boolean).join(', ');
}

/** `profile` on a home page that says so, `article` for a section's pages, else `website`. */
export function ogType(input: HeadInput): string {
  const { page, collections, overrides } = input;
  if (overrides?.ogType) return overrides.ogType;
  if (isHome(input)) return page?.seo.og_type === 'profile' ? 'profile' : 'website';
  return page?.seo.og_type ?? (page ? (collections[page.collection]?.og_type ?? 'website') : 'website');
}

/** The share image: the SEO tab's, the entry's `image`, else the default card; a listing without an entry shares the home page's. */
export function image(input: HeadInput): ShareImage | null {
  const { page, site, pages, publicDir, status } = input;
  if ((status ?? 200) >= 400) return null;
  const own = page?.seo.image ?? page?.image ?? null;
  if (own) {
    const size = publicDir ? measure(publicDir, own) : null;
    return {
      url: absolute(site.url, own),
      width: size?.width ?? IMAGE_WIDTH,
      height: size?.height ?? IMAGE_HEIGHT,
      alt: null,
    };
  }
  // The generated card (og.png.ts, og/[...uri].png.ts); a listing without an entry shares the home page's.
  const subject = page ?? byUrl(pages).get('/') ?? null;
  if (!subject?.url) return null;
  return {
    url: absolute(site.url, cardUrl(subject.url)),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    alt: subject.seo.og_title ?? subject.title,
  };
}

function websiteNode(site: SiteConfig) {
  return clean({
    '@type': 'WebSite',
    '@id': websiteId(site),
    url: home(site),
    name: site.name,
    alternateName: str(site.seo.site_alternate_name),
    publisher: { '@id': publisherId(site) },
  });
}

/** Who is behind the site: a Person, with the organisations they work for (the settings' employer and the other sites). */
function publisherNode(site: SiteConfig) {
  const seo = site.seo;
  const types = list(seo.publisher_type).length ? list(seo.publisher_type) : ['Person'];
  const portrait = str(seo.publisher_logo) ?? str(site.attributes.logo);
  const employer = str(site.settings.employer);
  return clean({
    '@type': types.length === 1 ? types[0] : types,
    '@id': publisherId(site),
    name: str(seo.publisher_name) ?? site.name,
    alternateName: oneOrMany(list(seo.publisher_alternate_name)),
    url: home(site),
    image: portrait ? absolute(site.url, portrait) : null,
    jobTitle: str(seo.job_title),
    sameAs: list(seo.same_as),
    worksFor: [
      ...(employer ? [clean({ '@type': 'Organization', name: employer, url: str(site.settings.employer_url) })] : []),
      ...site.other_sites.map((other) => ({
        '@type': 'Organization',
        '@id': `${other.url.replace(/\/$/, '')}/#publisher`,
        name: other.name,
        url: other.url.replace(/\/$/, ''),
      })),
    ],
  });
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
  const { page, site, pages } = input;
  if (!page || isHome(input) || !page.url) return null;
  const trail = breadcrumbs(page.url, pages).map((c, i) => ({
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
  const { page, site, collections } = input;
  const type = page ? collections[page.collection]?.schema : null;
  if (!page || !type) return null;
  return clean({
    '@type': type,
    '@id': `${url(input)}#article`,
    headline: page.title,
    description: head.description,
    image: head.image ? [head.image.url] : null,
    datePublished: page.date ? atom(page.date) : null,
    dateModified: page.updated ? atom(page.updated) : null,
    author: { '@id': publisherId(site) },
    publisher: { '@id': publisherId(site) },
    mainEntityOfPage: { '@id': head.canonical ?? url(input) },
  });
}

/** The editors' nodes from the SEO tab's "Extra JSON-LD" field: an object or a list of objects; anything else is ignored. */
function customNodes(page: Page | null): Record<string, unknown>[] {
  if (!page?.seo.json_ld) return [];
  try {
    const decoded = JSON.parse(page.seo.json_ld);
    if (Array.isArray(decoded)) return decoded.filter((n) => n && typeof n === 'object');
    return decoded && typeof decoded === 'object' ? [decoded] : [];
  } catch {
    return [];
  }
}

export function head(input: HeadInput): Head {
  const { site, page, collections } = input;
  const status = input.status ?? 200;
  const desc = description(input);
  const img = image(input);
  const type = ogType(input);
  const ogT = ogTitle(input);
  const can = canonical(input);
  const article = page ? collections[page.collection]?.og_type === 'article' || type === 'article' : false;
  const graph =
    status >= 400
      ? []
      : [
          websiteNode(site),
          publisherNode(site),
          webPageNode(input, { description: desc, image: img, ogTitle: ogT, ogType: type }),
          breadcrumbNode(input),
          articleNode(input, { description: desc, image: img, canonical: can }),
          ...customNodes(page),
        ].filter((n): n is Record<string, unknown> => n !== null);
  return {
    title: title(input),
    description: desc,
    canonical: can,
    robots: robots(input),
    ogType: type,
    ogTitle: ogT,
    url: url(input),
    siteName: site.name,
    locale: site.locale,
    image: img,
    published: article && page?.date ? atom(page.date) : null,
    modified: article && page?.updated ? atom(page.updated) : null,
    twitterSite: str(site.seo.twitter_handle) ? '@' + str(site.seo.twitter_handle)!.replace(/^@/, '') : null,
    graph,
  };
}

/** The JSON-LD as the addon printed it: `<` and `&` as \u escapes, so it is safe inside a <script>. */
export function jsonLd(graph: Record<string, unknown>[]): string | null {
  if (graph.length === 0) return null;
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026');
}

/** Whether a page is listed in the sitemap and llms.txt: its own canonical address, indexable, not left out. */
export function inSitemap(page: Page, site: SiteConfig): boolean {
  if (page.draft || !page.url || page.seo.noindex || page.seo.sitemap === false) return false;
  const canonical = page.seo.canonical?.replace(/\/$/, '');
  return !canonical || canonical === absolute(site.url, page.url).replace(/\/$/, '');
}
