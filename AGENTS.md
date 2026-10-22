# jothamlim.com and cothink.ing (Astro)

Two static Astro 7 sites in one npm workspace: the owner's digital gardens,
Markdown content collections with a garden layer on top (Explorer, `[[wiki
links]]`, backlinks, graph, ⌘K search, feeds, sitemap, JSON-LD, share cards).
No CMS, no server: content is Markdown edited by hand, reviewed with `astro
preview`, served by two Cloudflare Workers of static assets. Everything else
is what Astro ships; the custom parts are listed under "What is custom".

## Map

```
package.json           workspaces: packages/garden, sites/*; root scripts run both sites
packages/garden/       @cothinking/garden: the shared code and its runtime dependencies (no site's name in it)
  config.mjs           gardenConfig({ root, site, urlOf, otherSite }): the Astro config both sites use
  content.ts           the schema pieces: base(image), seo, dated, enumOf, loader (content.config.ts imports it as @garden/content.ts)
  lib/                 the garden layer, plain TypeScript (tests cover it): see "How a page is built"
  lib/markdown/        the remark/rehype plugins and the Shiki transformer
  components/          22 .astro components; layouts/Layout.astro is the shell
  scripts/             one TypeScript module per client behaviour, each imported by the component that owns the markup
  styles/              tokens.css (the only colours), shell.css (the grid and its states), components.css, site.css
  assets/              fonts (woff2 for the pages, ttf for the cards), icons (SVG components), portrait.jpg
  tests/               markdown, garden (the lib on a made-up site), sites (both real sites), tokens
sites/<site>/          one Astro root each: jothamlim, cothinking
  astro.config.mjs     gardenConfig(...) with the site's config and the other site's folder
  src/site.config.ts   the site: name, URL, collections, navigation, redirects, authors, SEO, marketing (`satisfies SiteConfig`)
  src/lib/urls.ts      urlOf(collection, id): where an entry lives
  src/lib/entries.ts   loadEntries() for the garden, and otherEntries() (the other site, for [[wiki links]])
  src/content.config.ts  the collections' schemas (zod, strict)
  src/content/<collection>/<id>.md   the pages
  src/assets/media/    the pictures the content embeds (Astro optimises them)
  public/              what is served as is: PDFs and their previews, the SVG diagram pairs, favicons, _headers
  src/pages/           the routes: one file per view, [slug].astro for the plain pages, the endpoints
  src/components/      the site's own views; src/styles/site.css imports the garden's and adds its @source folders
  tests/               build.test.ts (reads dist/), smoke.mjs (Playwright against the preview)
scripts/               snapshot.mjs and diff-snapshot.mjs: compare two builds page by page
```

## How a page is built

`sites/jothamlim/src/pages/essays/[slug].astro` gets the entry with Astro's
`getCollection`/`render` and hands it to `<Entry entry={entry}>`
(`garden/components/Entry.astro`: breadcrumbs, title, outline, body, pager,
rail), which renders inside `layouts/Layout.astro` (the shell) with the head
from `lib/seo.ts`.

- **The garden's model** is `lib/entry.ts`: every content entry becomes a
  `SiteEntry` (address, title, dates, body, the opening paragraphs, and the
  fields the garden reads, `null` where a site has none) through `toSiteEntry`.
  `lib/load.ts` `garden()` loads them once per build: `site`, `entries`,
  `live` (published), `byUrl`, `entry(astroEntry)`, `titles`, `explorer`,
  `graph`, `htmlOf()`. A site's view keeps its own typed Astro entry for its
  own fields and asks `g.entry(entry)` for the garden's.
- **A site tells the garden three things**, the only `@site` imports the
  garden makes: `src/site.config.ts` (the config), `src/lib/entries.ts` (its
  entries) and `src/styles/site.css`. `lib/site.ts` types the config; a
  collection's `landing` makes it a section under that page, `article`,
  `feed`, `order`, `explorer`, `groupBy`, `categories`, `types`, `graphSection`
  and `graphColour` say the rest.
- **Addresses** come from `src/lib/urls.ts` (`urlOf`), pure, so the Astro
  config and the tests use it too. `[[wiki links]]` resolve against a title
  index scanned off both sites' `src/content` with Astro's own front-matter
  reader (`lib/scan.ts`): once per build, on every render in `astro dev`.
- **The Markdown pipeline** (`lib/markdown/index.ts`, in `config.mjs`): remark
  `wiki-links`; rehype `external-links`, `heading-ids` (GitHub-style, emoji
  cleaned; Astro keeps them), `callouts`, `excerpt` (the first paragraphs, for
  descriptions), `heading-anchors` (the icon is CSS). Astro does the rest:
  GFM, Shiki in both themes inside the chrome `shiki-code-block.ts` draws, raw
  HTML, images, `headings`.
- **Panels and dialogs** are the platform's: the Explorer is
  `<aside id="explorer" popover>` (a drawer the header's `popovertarget`
  button opens, light-dismissed, no JS needed; the sticky column from lg
  outside a room: `styles/shell.css`); the palette and keys card are
  `<dialog closedby="any">`, opened with `showModal()`, which puts an open
  drawer away. Reader mode is `<html data-hide-explorer data-hide-rail>`; a
  room is `.shell[data-room]` (its whole `<main>` is in the search index, as
  no `<Entry>` marks it); the status line's mode is CSS (READER from
  `html[data-hide-explorer]`, SEARCH from `body:has(#palette[open])`).
- **Aliases and processor.** `@site/*` and `@garden/*` come from each
  site's `tsconfig.json` `paths` (`@site/*` → that site's `src/*`,
  `@garden/*` → `packages/garden/*`), which Astro turns into Vite aliases
  (https://docs.astro.build/en/guides/imports/#aliases). So one garden file
  imports whichever site is being built, and `content.config.ts` can import
  `@garden/content.ts`. `config.mjs` sets `markdown.processor: unified()`
  instead of Astro 7's default Sätteri, because the plugins above are remark
  and rehype plugins.
- **Never use `Astro.url`** for a page's address: `build.format: 'file'`
  makes it `/x.html`. Pass `path`.

| Behaviour | Script | Owned by |
| --- | --- | --- |
| theme toggle, reader mode | `theme.ts`, `reader.ts` | Header |
| folders, scroll, focus on open | `explorer.ts` | Explorer |
| ⌘K search (Pagefind) | `palette.ts`, `pagefind.ts` | Palette (NotFound uses pagefind too) |
| vim keys, `?`, Ctrl+K hint | `keys.ts` | Keys |
| progress bar, scroll position | `progress.ts` | Statusline |
| scroll spy | `outline.ts` | Outline |
| hover previews, zoom, heading links, code copy | `popovers.ts`, `zoom.ts`, `heading-links.ts`, `code-copy.ts` | Prose |
| the local graph (d3-force) | `graph.ts` | Rail, so d3 ships only on rail pages |

Styles: `tokens.css` is the only file with a colour (`light-dark()` values;
the toggle sets `<html data-theme>`); `site.css` hands them to Tailwind v4
utilities; `shell.css` is the grid, the drawer, reader mode, the status
line's mode and `.light-only`/`.dark-only`; `components.css` styles markup no
component writes (plugins' output, raw HTML in content, what the scripts
build). The share cards read their four colours off `tokens.css`
(`lib/palette.ts`; `tests/tokens.test.ts` guards the lines' shape).

## Recipes

- **A page**: `src/content/<collection>/<id>.md` (`[a-z0-9-]` only) with
  `title`, `date` on a dated collection, optional `description`, `image`
  (a file under `src/assets/media`, referenced relatively), `updated`,
  `draft: true`, `seo` (`title`, `description`, `canonical`, `og_type`,
  `noindex`, `sitemap`). Headings start at `##` (the check fails otherwise); `[[Title]]` links a page on
  either site; `> [!NOTE] Title` is a callout; raw HTML is allowed
  (`<img class="wiki-logo-light">`/`-dark` pairs, `<figure class="wiki-pdf">`,
  `<a class="button">`).
- **A page with its own view**: a file in `src/pages/` that `getEntry`s the
  landing entry, and its id in `[slug].astro`'s `OWN` list (a page in both
  places fails the build: `prerenderConflictBehavior`).
- **A front-matter field**: the collection's schema in `content.config.ts`;
  views read `entry.data.<field>`. A field the garden should read on every
  site goes into `SiteEntry` and `toSiteEntry`.
- **A collection**: a schema in `content.config.ts`, its line in
  `loadEntries()`, its address in `urls.ts`, its entry in
  `site.config.ts` `collections`, a landing page and its `explorer` item, a
  page file for its route (`src/pages/<landing>/[slug].astro`), and the
  landing's own view (`src/pages/<landing>/index.astro`) with its id in
  `[slug].astro`'s `OWN` list. Its graph colour is `graphColour`, one of the
  `--site-graph-*` tokens; a new colour is a token in `styles/tokens.css`,
  its `--color-graph-*` line in `styles/site.css` and its class in
  `scripts/graph.ts` `COLOURS`.
- **A behaviour**: a `scripts/<name>.ts` exporting `init<Name>()`, imported
  by a `<script>` in the component that owns the markup. Talk to another
  component through the platform (`showModal()`, `hidePopover()`).
- **A site**: `sites/<name>/` with `astro.config.mjs`, `tsconfig.json`,
  `wrangler.jsonc`, `cloudflare.env`, `package.json`, `src/site.config.ts`,
  `src/lib/{urls,entries}.ts`, `src/content.config.ts`, `src/styles/site.css`,
  `src/pages/`; name it in the other site's `entries.ts` and `astro.config.mjs`,
  and in the other site's `site.config.ts` `otherSite`. Give it a dev and a
  preview port in the root `package.json` `dev` and `preview` scripts, and
  the preview port as `PREVIEW_URL`'s default in its `tests/smoke.mjs`.

## Commands

```sh
npm run check         # both sites: astro sync, astro check (0 errors expected)
npm test              # vitest: the markdown pipeline, the lib, both sites' content, navigation and redirects (check.ts), tokens, and dist/ when built
npm run build         # both sites, each into sites/<site>/dist
npm run build:force   # the same, with Astro's content cache cleared: after changing a Markdown plugin (see Verify)
npm run dev           # both sites' astro dev in the background: jothamlim :4321, cothinking :4322
npm run preview       # both sites' last build: jothamlim :4331, cothinking :4332
npm run stop          # stops every dev and preview server
npm run format        # prettier
npm run <dev|build|preview|check|smoke|deploy> -w sites/<site>   # one site
```

## Verify

`npm run check && npm test && npm run build:force`, then `npm run preview` and
`PLAYWRIGHT_BROWSERS_PATH=$(cat DEV_FILES/<site>/playwright-browsers-path)
npm run smoke -w sites/<site>` (Playwright against the preview; the browsers
are nixpkgs', never `npx playwright install`). The path file is local
(`DEV_FILES/` is gitignored): write it once with
`nix build --no-link --print-out-paths nixpkgs#playwright-driver.browsers >
DEV_FILES/<site>/playwright-browsers-path`, from a nixpkgs whose Playwright
matches the `playwright` pin in `package.json`. For a refactor:
`node scripts/snapshot.mjs <site> before.json`, change, build,
`node scripts/snapshot.mjs <site> after.json`, then
`node scripts/diff-snapshot.mjs before.json after.json --allow allow.txt`
(`<url-glob> <field>` lines, the fields including `head` (every `<meta>`),
`jsonld` and `body` (the text of `<main>`); `files`, `feeds`, `graph`,
`llms`… whole).

Two Astro behaviours to know: rendered Markdown is cached until the file or
the config changes, so after changing a plugin run `npm run build:force`
(`npm run build -- --force` does not work: npm keeps the flag; deploys always
force); and a page's `[[wiki link]]` to a renamed page refreshes in dev
when that page is next saved (or on restart), as its render is cached too.

## Deploy

Each site is a Worker of static assets (`wrangler.jsonc`: `dist/`,
`not_found_handling: "404-page"`, `html_handling: "drop-trailing-slash"`),
a Custom Domain at jothamlim.com and cothink.ing, both in the owner's
account (`account_id`). **Every push to `main` deploys both**
(`.github/workflows/deploy.yml`: check, the garden's tests, a forced build,
the site's build tests, then `wrangler deploy`, with the repository secret
`CLOUDFLARE_API_TOKEN`, a token scoped to Workers Scripts and the two zones;
pull requests only build). `npm run deploy -w sites/<site>` is the manual
fallback: it builds with `--force` and runs `wrangler deploy` through
`op run --env-file=cloudflare.env`, whose one line is the 1Password
reference of a scoped token (`CLOUDFLARE_API_TOKEN=op://CoThinking/Cloudflare/CF Workers API`),
never a value. `/_astro/*` is cached a year by `public/_headers`;
pages are revalidated. Locally, `wrangler dev` needs `steam-run` on NixOS.

## Glossary

| Term | Meaning |
| --- | --- |
| **SiteEntry** | The garden's own shape for any entry of either site: address, title, dates, body, opening paragraphs and the fields the garden reads (`lib/entry.ts`). |
| **`garden()`** | The one thing a component awaits: the entries, the title index, the Explorer and the graph, built once per build (`lib/load.ts`). |
| **`live`** | `garden().live`: the published entries (no `draft: true`), the ones a reader can see. |
| **Landing page** | The `pages` entry a section hangs under (`/essays` for the essays); a collection's `landing` in `site.config.ts` names it. |
| **Section** | A collection with a landing page: its pages are children in breadcrumbs, the Explorer and the graph. |
| **Room** | A full-width page with no Explorer column and no rail (`<Layout room>`): cothink.ing's home, privacy page and case studies. |
| **Rail** | The right-hand column about the current page: graph, outline, "Linked from" (`components/Rail.astro`). |
| **Explorer** | The site as one tree on the left, from `navigation.explorer` plus each section's pages (`lib/explorer.ts`). |
| **Title index** | Lower-cased title → address over both sites' published pages: what `[[Title]]` resolves against (`lib/titles.ts`). |
| **`OWN`** | The list in a site's `src/pages/[slug].astro` of the `pages` entries with a view of their own file (the home page, the landings); `[slug].astro` builds the rest. |

## What is custom, and deviations

Custom: `lib/*` (the garden layer), the Markdown plugins, the scripts, the
satori share cards, the smoke tests, the snapshot scripts. Native: content
collections, `render()`, `getStaticPaths`/`paginate`, endpoints, `redirects`
(meta-refresh pages, status 200, by the owner's choice), the fonts API,
`<Image>`, Shiki, `@astrojs/sitemap`, `@astrojs/rss`, Pagefind
(`astro-pagefind`), Tailwind through Vite, popovers and dialogs.

Deviations from the old Laravel sites: `/notes/2` instead of `?page=2`;
heading ids are GitHub-style; `og:image` is a satori card or the entry's own
optimised image; feeds carry the page's HTML; no PDF redirects; the search is
Pagefind; the sitemap is `/sitemap-index.xml`; the 404's host, path and
suggestions are filled in by the browser; an image's title is not a caption.
