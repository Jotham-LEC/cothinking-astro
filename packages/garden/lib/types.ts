// The build-time model every module in garden/lib works on. Nothing here names
// a site: the shapes come from src/data (written by the import) and the
// content collections.

export type Seo = {
  title?: string;
  description?: string;
  canonical?: string;
  og_type?: string;
  og_title?: string;
  og_description?: string;
  image?: string;
  max_snippet?: number;
  noindex?: boolean;
  nofollow?: boolean;
  sitemap?: boolean;
  nosnippet?: boolean;
  json_ld?: string;
};

/** A published or draft entry of any collection, with its address worked out. */
export type Page = {
  collection: string;
  slug: string;
  /** Site-relative path (`/`, `/essays/x`); null for an entry outside its tree. */
  url: string | null;
  title: string;
  description: string | null;
  image: string | null;
  date: Date | null;
  updated: Date | null;
  draft: boolean;
  template: string | null;
  order: number | null;
  parent: string | null;
  /** A note's post type (text, photo, link, quote, video). */
  type: string | null;
  seo: Seo;
  body: string;
  /** Every front-matter field, for the templates (quote, cite, outlet, photos…). */
  data: Record<string, unknown>;
};

/** A page a reader can see: published, with an address (`published()` in pages.ts). */
export type LivePage = Page & { url: string };

/** What the import reads off a collection's YAML and blueprints. */
type CollectionConfig = {
  title: string;
  route: string;
  dated: boolean;
  root: boolean;
  orderable: boolean;
  mount?: { collection: string; slug: string };
  template?: string;
  /** Open Graph type and JSON-LD node for the collection's pages (articles). */
  og_type?: string;
  schema?: string;
  types?: { handle: string; title: string }[];
  options?: Record<string, Record<string, string>>;
  /** The site a collection's entries live on, when that is not this one (pieces reshared from it): they have no address here. */
  origin?: string;
  /** How the Explorer groups the collection's pages: by year, or by its `category` select's options. */
  group_by?: 'year' | 'category';
  /** `with_content`: the Explorer lists only the pages with a body. */
  explorer?: 'with_content';
  /** The landing page's graph holds the whole collection, not only its neighbours. */
  graph_section?: boolean;
  /** The graph's colour for the collection's pages: a `--site-graph-*` token's name (garden/styles/tokens.css). */
  graph_colour?: string;
};

export type Collections = Record<string, CollectionConfig>;

/** Who wrote an entry (its `author` field; src/data/authors.yaml). */
export type Author = { id: string; name: string; bio?: string; url?: string };

export type NavItem = { title?: string; entry?: string; url?: string; children?: NavItem[] };

export type SiteConfig = {
  handle: string;
  name: string;
  url: string;
  locale: string;
  lang: string;
  attributes: {
    logo?: string;
    logo_dark?: string;
    favicon?: string;
    explorer?: boolean;
    pages?: string;
  };
  feeds: string[];
  other_sites: { handle: string; name: string; url: string }[];
  settings: Record<string, unknown>;
  seo: Record<string, unknown>;
  marketing: Record<string, unknown>;
};

/** An entry as a loader hands it over, before its address is known. */
export type RawEntry = { collection: string; slug: string; data: Record<string, unknown>; body: string };
