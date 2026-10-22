# jothamlim.com and cothink.ing (Astro)

Two static Astro 7 sites in one repo: the digital gardens that
`~/Projects/jothamlim.com-laravel` served from Statamic, rebuilt as Markdown
content collections with the garden features (Explorer, `[[wiki links]]`,
backlinks, graph, ⌘K search, feeds, sitemap, JSON-LD, share cards) as a layer
over Astro's own Markdown. No CMS, no server: content is Markdown edited by
hand, reviewed locally with `astro preview`, served by two Cloudflare Workers
(static assets only). Full design and inventory: the Laravel repo's
`DEV_FILES/specs/astro-rebuild.md`.

## Layout

```
package.json, node_modules/   one install for both sites
garden/          the shared code (no site's name in it)
  config.mjs     gardenConfig({ root }): the Astro config both sites use
  content.ts     garden(src): the schema pieces both content.config.ts files use
  lib/           the wiki layer (`@garden/lib/…`)
  components/    the garden's components: Entry, Head, Header, Explorer, Rail…
  layouts/       Layout.astro, the shell
  styles/ scripts/ assets/
sites/<site>/    one Astro root each: jothamlim, cothinking
  astro.config.mjs        `export default gardenConfig({ root: … })`, nothing else
  tsconfig.json           @garden/* → ../../garden/*, @site/* → ./src/*
  wrangler.jsonc          its Worker
  src/content.config.ts   its content collections, plus garden/content.ts' data collections
  src/content/ src/data/  the import's output: Markdown and YAML
  src/pages/              its routes and endpoints
  src/components/ src/lib/ src/assets/   its own views and helpers
  src/styles/site.css     imports garden/styles/site.css and adds its own @source folders
  public/                 its media
scripts/         import, golden, compare (migration only) and check-content; each takes SITE
tests/           shared tests, tests/<site>.test.ts and tests/<site>.build.test.ts, the smoke test
DEV_FILES/<site>/   golden set, manifest, screenshots, audits (git-ignored)
```

Each site has its own `.astro/`, `dist/` and `public/`, so both can run
`astro dev` or `astro preview` at once. Astro's background servers need an
absolute root: the npm scripts `cd` into the site rather than pass `--root`.

## Read first

**Where a page's HTML comes from**, for a jothamlim.com essay:
`sites/jothamlim/src/pages/essays/[slug].astro` (finds the page, renders its
Markdown) → `garden/components/Entry.astro` (breadcrumbs, title, outline,
body, pager, rail) → `garden/layouts/Layout.astro` (the shell: header,
Explorer, footer, scripts) → `garden/components/Head.astro`, which prints
`garden/lib/seo.ts`'s head model. The body is Astro's Markdown run through
the plugins listed in `garden/lib/markdown/index.ts`. A cothink.ing page goes
through `sites/cothinking/src/pages/[...slug].astro`, which picks a view in
`src/components/templates/` by the page's `template`.

**A Laravel map.** A content collection is a Statamic collection; a page file
in `src/pages/` is a template plus its route (cothink.ing's views are in
`src/components/templates/`, one per Blade view); `garden/lib/` is the tags
and helpers (`App\Tags\Wiki`, `App\Seo`); `await wiki()`
(`garden/lib/load.ts`) is a service-container singleton, built once per
build; a `Page` is a model with its accessors (address, section, eyebrow)
already computed. Imports use two aliases like namespaces: `@garden/…` for
the shared code, `@site/…` for the site's own `src/`.

How a page is built:

1. **Content** is `sites/<site>/src/content/{collection}/{slug}.md` (front
   matter + Markdown), validated by the site's `src/content.config.ts` (zod,
   strict: an unknown key fails the build). `src/data/` holds the **data
   collections**, defined once in `garden/content.ts`: `site.yaml` (name,
   URL, locale, attributes, the Brand/Marketing/Settings globals, `feeds`,
   `other_sites`), `collections.yaml` (each content collection's title,
   route, mount, note types, select options, whether its pages are
   articles, and the flags below), `navigation.yaml` (explorer, header,
   footer trees), `redirects.yaml`, `authors.yaml` (only on a site with
   authors: cothink.ing), and `other-site-titles.json` (the other site's
   titles → addresses; the `[[wiki link]]` index adds this site's published
   pages at build time, `garden/lib/titles.ts`). `.astro/` is Astro's
   generated cache of all this (git-ignored).
2. **The collection flags** in `collections.yaml` say what the Laravel app
   hard-coded by handle; the import writes them from its per-site defaults
   (`SITE_DEFAULTS` in `scripts/import-content.mjs`), so `garden/lib` names
   no collection but `notes` (types) and the page collections:
   `group_by: year | category` (the Explorer groups the pages by year, or by
   the `category` select's options), `explorer: with_content` (only the
   pages with a body), `graph_section: true` (the landing page's graph holds
   the whole section), `graph_colour: essays | notes | publications |
   projects` (the graph's colour token; `pages` otherwise), `origin` (a
   collection whose entries live on the other site: cothink.ing's
   `reshared`).
3. **The wiki layer** (`garden/lib/`, no Astro imports except `load.ts`)
   turns entries into `Page`s with addresses (`pages.ts`, `urls.ts`;
   `published()` returns `LivePage`s, whose `url` is never null), and
   computes the Explorer, the drawer's menu, which panels a page has and the
   header/footer links (`explorer.ts`), the graph and backlinks (`graph.ts`,
   from `links.ts`), the outline (`toc.ts`), the pager (a series' parts by
   `part`, or the notes by date), the publications years, the note types,
   breadcrumbs, a page's eyebrow/feed/source/reshared original
   (`entry.ts`), the head model (`seo.ts`: a Person or an Organization
   publisher, article authors, a reshare's canonical), the feeds' items
   (`feed.ts`), robots/llms and the sitemap's entries (`textFiles.ts`,
   `sitemap.ts`), the redirects (`redirects.ts`) and the share card
   (`ogCard.ts`, `share.ts`: the owner's portrait on both sites).
   `files.ts` loads the same model from disk for `scripts/check-content.ts`,
   the tests and `garden/config.mjs`.
4. **The Markdown pipeline** (`garden/lib/markdown/`, wired in
   `garden/config.mjs` through `@astrojs/markdown-remark`'s `unified()`
   processor): remark-wiki-link + `remark-wiki-links` (titles →
   `a.wiki-link` / `span.wiki-link-missing`), `rehype-external-links`,
   `rehype-raw`, `rehype-heading-ids` (Laravel's `Str::slug`, `slug.ts`),
   `rehype-callouts`, `rehype-images` (sizes, eager/lazy, figures,
   `zoomable`), `rehype-heading-anchors`. Each custom plugin names itself
   and the file when it fails (`named.ts`). `smartypants` is off and there
   is no syntax highlighter: the browser's `code-blocks.js` draws the
   chrome. `feed.ts` is the plain pipeline for feeds, descriptions and
   llms.txt.
5. **The shell** is `garden/layouts/Layout.astro` (head, GTM, header,
   Explorer drawer/column, main, rail slot, palette, keys, status line,
   footer, scripts). A `room` (cothink.ing's home, privacy and case
   studies) takes the full width on the terminal ground (`bg-terminal`),
   has no rail or status line, and keeps the drawer at every width; it has
   no Explorer when the site's `explorer` attribute is off. The site's
   `closed_panels` attribute says which panels start put away until the
   reader chooses. `garden/components/Entry.astro` has the slots `head`,
   `before-body`, `after-body`, `after-article` and `body`, a `path` for an
   address that is not the entry's own (`/notes/2`) and `extraHeadings` for
   a view's own h2s (Blade read the outline off the rendered body; a view
   that writes its h2s passes them). It shows a reshared piece's text after
   the page's own.
6. **The sites' own views.** jothamlim.com: `src/pages/` (home, the pages
   collection by template, essays/projects/publications, the notes stream
   paginated at `/notes/2`, note types) and `src/components/notes/`.
   cothink.ing: `src/components/templates/` (Page, Problems, Problem, Wiki,
   WikiEntry, Work, CaseStudy, HowIWork, Websites), the pieces they share in
   `src/components/cothinking/` (Email, Whatsapp, Enquiry, NextStep, Prices,
   ProblemList, QuoteBy, Related, WorkTiles, WorkStats, AboutMe, Timeline),
   and `src/lib/` (`contact.ts`: mailto/WhatsApp links and prices from the
   settings; `images.ts`; `related.ts`). Both have the endpoints
   `graph.json`, `robots.txt`, `llms.txt`, `feed.xml`, `og.png`,
   `og/[...uri].png` and `404.astro`.

**Images Glide resized** (cothink.ing's work tiles 800 × 450 cropped from
the top at quality 75, a case study's screenshot at most 1280 wide at 80,
the testimonial photo 96 × 96 cropped at 80) go through astro:assets'
`getImage` (`sites/cothinking/src/lib/images.ts`). The files stay in
`public/media` with the rest: `import.meta.glob('/public/media/…')` hands
them to `getImage`, which cannot read `public/` by path, and only the files a
page asks for are built. The home page's photo is a plain `<img>`.

Never use `Astro.url` for a page's address: `build.format: 'file'` makes it
`/x.html`. Paths to `public/` and the TTFs in bundled code come from
`garden/lib/paths.ts` (`import.meta.env.PROJECT_ROOT` and `GARDEN_ROOT`, set
by `garden/config.mjs`), not `import.meta.url`, which points into `dist/`
once bundled.

## Commands

Every per-site command is `npm run <command>:<site>`, `<site>` being
`jothamlim` or `cothinking`; `build` and `check` run both.

```sh
npm run check                 # both sites: astro sync, scripts/check-content.ts, astro check
npm run check:<site>          # astro sync (every file against its schema), the content check (wiki links, media, routes, trees,
                              # references, authors, reshared pieces, linkable and unique titles), astro check (0 errors expected)
npm run build                 # both sites, each into sites/<site>/dist
npm run dev:<site>            # astro dev, a background server; two sites can run at once (--port)
npm run preview:<site>        # astro preview, a background server (`npx astro preview status` / `stop` inside sites/<site>)
npm run test                  # vitest: slugs, the Markdown, each site's wiki layer and head model, each site's dist/
PREVIEW_URL=http://localhost:4321 npm run smoke:<site>   # Playwright against the preview (tests/smoke/<site>.mjs); browsers from NixOS
npm run deploy:<site>         # build, then `wrangler deploy` with the Cloudflare key from 1Password (see Cloudflare)
npm run import:<site>         # migration: Laravel repo → sites/<site>/src/content, src/data (LARAVEL env; --media copies public files)
npm run golden:<site>         # migration: capture every URL from the local Laravel app (php artisan serve --port=8004, APP_ENV=production)
npm run compare:<site>        # migration: golden vs dist, per page; `-- /wiki` limits it; `--verbose` prints everything
```

The build tests skip (with a warning) without a build; the tests that compare
with the Laravel site's pages need the golden set (`DEV_FILES/<site>/golden`)
and skip without it. The migration scripts (`import-content.mjs`,
`golden.mjs`, `compare.mjs`, `dump-heading-ids.php`) are deleted, with
`node-html-parser`, once the owner accepts the sites.

## Authoring

- A page is a file: `sites/<site>/src/content/<collection>/{slug}.md` with
  `title`, `date` for a dated collection (`2026-10-07` or
  `2026-10-07T09:43:00Z`, stored in UTC and printed in `Asia/Kuala_Lumpur`),
  optional `description`, `image` (`/media/…`, must exist in `public/`),
  `updated`, `draft: true`, and the `seo` group (`title`, `description`,
  `canonical`, `og_type`, `image`, `noindex`, `nofollow`, `sitemap: false`,
  `nosnippet`, `json_ld`). Each collection's own fields are in the site's
  `content.config.ts`: jothamlim.com's notes add `type` and the type's fields,
  publications `outlet`, pages `template` and `order`; cothink.ing's pages
  add `template` and `related_wiki`, problems `what_i_do` and `case_study`,
  wiki entries `author`, `category`, `related_pages`, `series` and `part`,
  `reshare`, work entries `website`, `year`, `kind`, `stats`, the testimonial.
- A reference names another entry as `collection/slug` (`wiki/speed-to-lead`);
  `npm run check:<site>` says when it names no page.
- Headings start at `##`. Link pages with `[[Title]]` or `[[Title|text]]`;
  a Markdown link to `/path` counts too. Both feed the graph and "Linked
  from". **Renaming a page or adding one changes the title index**, which
  `garden/config.mjs` reads once: restart `astro dev`.
- Raw HTML is allowed (`wiki-logo-light`/`-dark`, `wiki-portrait`,
  `<figure class="wiki-pdf">`, `<a class="button">`). Callouts:
  `> [!NOTE] Title` with note, info, tip, important, warning, danger, caution.
- Media is `sites/<site>/public/media/…`. The Aporetic fonts are
  `garden/assets/fonts/*.woff2` and `ttf/*.ttf` (for the share cards).

## Recipes

- **A front-matter field**: add it to the collection's schema in the site's
  `src/content.config.ts`; views read it from `page.data`. Only a field every
  page has also goes into the `Page` type (`garden/lib/types.ts`) and
  `toPages` (`garden/lib/pages.ts`).
- **A collection**: a schema and a `loader('name')` line in the site's
  `src/content.config.ts`, an entry in its `src/data/collections.yaml`
  (title, route, mount, and any flag), a page file for its route, and an
  item in the `explorer` navigation for its landing page.
- **A third site**: `sites/<name>/` with the same four files
  (`astro.config.mjs`, `tsconfig.json`, `src/content.config.ts`,
  `src/styles/site.css`), its scripts in `package.json`, `wrangler.jsonc`,
  and its name in `scripts/site.mjs`.

## What is native, what is custom

Native: content and data collections (`glob` and `file()` loaders, zod,
`render()`, `headings`), `getStaticPaths`/`paginate`, endpoints, `redirects`
(meta-refresh pages), MDX, `@astrojs/sitemap`, `@astrojs/rss`,
astro:assets' `getImage`, `rehype-external-links`, SVG components,
`<script>` bundling, `is:inline`/`define:vars`, Tailwind through Vite,
Pagefind through `astro-pagefind`, tsconfig path aliases, Cloudflare's static
assets (404 page, trailing slashes). Custom and unavoidable: the Markdown
plugins, `garden/lib/*`, the Pagefind glue in `palette.js`, the satori share
cards, the smoke test and the migration scripts.

Deviations from the Laravel sites, by design (listed in `scripts/compare.mjs`):
`/notes/2` instead of `?page=2`; `og:image` is a satori card (or the raw
image, uncropped); resized images are astro:assets' files rather than
Glide's; Vite asset names; search is Pagefind; no PDF redirects (the build
log names each one it drops); the feeds are `@astrojs/rss`'s; the sitemap is
`/sitemap-index.xml`; the 404's host/path and suggestions are filled in by
the browser; the old addresses are meta-refresh pages (status 200), not
301s; a case study's "More work" link is `/work` rather than the absolute
address. The compare also allows for what only the local golden set shows:
an article author without its `@id`, and own-site links counted as external.
Google Tag Manager (`site.yaml` `marketing.gtm_id`) is printed as the addon
printed it, in production builds only.

## Cloudflare

Each site is a Worker of static assets (`sites/<site>/wrangler.jsonc`:
`dist/`, `not_found_handling: "404-page"`, `html_handling:
"drop-trailing-slash"`), named `jothamlim` and `cothinking`. `npm run
deploy:<site>` builds and deploys it; wrangler signs in with the Global API
key through `op run --env-file=cloudflare.env`, which holds only 1Password
references, so the key is never in a file or a log. The custom domains
(`jothamlim.com`, `cothink.ing`) replace the DNS records that point at the
VPS: attaching them is the cutover and waits for the owner. `www.cothink.ing`,
`coach.*`, `dev.*`, `blog.*` and the Laravel CP stay on the VPS.

Locally, `wrangler dev` (in `sites/<site>`) needs `steam-run` on NixOS
(`steam-run npx wrangler dev`): workerd is a generic Linux binary.

## Review routine

`npm run import:<site> -- --media && npm run check && npm run test && npm run
build && npm run compare:jothamlim && npm run compare:cothinking`, then the
previews, `npm run smoke:<site>` for each, and the browser: dark and light,
the drawer below `lg` (and in a room at any width), a page with
callouts/figures/a PDF, the palette, the graph, `/no-such-page`.
`DEV_FILES/` (git-ignored) holds the import manifests, the golden sets,
screenshots and audits. Tooling outside npm (Node, fontTools, Playwright's
browsers) is declared in `~/Projects/nixos`, not installed ad hoc.
