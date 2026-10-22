# jothamlim.com (Astro)

A static Astro 7 site: the digital garden that `~/Projects/jothamlim.com-laravel`
served from Statamic, rebuilt as Markdown content collections with the garden
features (Explorer, `[[wiki links]]`, backlinks, graph, ⌘K search, feeds,
sitemap, JSON-LD, share cards) as a layer over Astro's own Markdown. No CMS, no
server: content is Markdown edited by hand, reviewed locally with
`astro preview`. Full design and inventory: the Laravel repo's
`DEV_FILES/specs/astro-rebuild.md`. This repo is one site; cothink.ing is a
separate project (`~/Projects/cothink.ing-astro`) with its own copies.

## Read first

**Where a page's HTML comes from**, for an essay:
`src/pages/essays/[slug].astro` (finds the page, renders its Markdown) →
`src/components/garden/Entry.astro` (breadcrumbs, title, outline, body, pager,
rail) → `src/layouts/Layout.astro` (the shell: header, Explorer, footer,
scripts) → `src/components/garden/Head.astro`, which prints `src/lib/seo.ts`'s
head model. The body is Astro's Markdown run through the plugins listed in
`src/lib/markdown/index.ts`.

**A Laravel map.** A content collection is a Statamic collection; a page file
in `src/pages/` is a template plus its route; `src/lib/` is the tags and
helpers (`App\Tags\Wiki`, `App\Seo`); `await wiki()` (`src/lib/load.ts`) is a
service-container singleton, built once per build; a `Page` is a model with
its accessors (address, section, eyebrow) already computed. Imports use
aliases like namespaces: `@lib/…`, `@components/…`, `@layouts/…`, `@assets/…`.

How a page is built:

1. **Content** is `src/content/{pages,essays,notes,projects,publications}/{slug}.md`
   (front matter + Markdown), validated by `src/content.config.ts` (zod,
   strict: an unknown key fails the build). `src/data/` holds the **data
   collections**, read by Astro's `file()` loader and validated in the same
   file: `site.yaml` (name, URL, locale, attributes, the Brand/Marketing/
   Settings globals, `feeds`, `other_sites`), `collections.yaml` (each content
   collection's title, route, mount, note types, select options, whether its
   pages are articles), `navigation.yaml` (explorer, header, footer trees),
   `redirects.yaml`, and `other-site-titles.json` (cothink.ing's titles →
   addresses, from the import; the `[[wiki link]]` index adds this site's
   published pages at build time, `src/lib/titles.ts`).
   `.astro/` is Astro's generated cache of all this (git-ignored): the source
   is always the Markdown and YAML.
2. **The wiki layer** (`src/lib/`, no Astro imports except `load.ts`) turns
   entries into `Page`s with addresses (`pages.ts`, `urls.ts`; `published()`
   returns `LivePage`s, whose `url` is never null), and computes the Explorer
   and header/footer links (`explorer.ts`), the graph and backlinks
   (`graph.ts`, from `links.ts`, which reads links off the Markdown as the
   renderer parses it), the outline (`toc.ts`), the notes pager, the
   publications years, the note types, breadcrumbs, a page's
   eyebrow/feed/source (`entry.ts`), the head model (`seo.ts`), the feeds'
   items (`feed.ts`, for `@astrojs/rss`), robots/llms and the sitemap's
   entries (`textFiles.ts`, fed to `@astrojs/sitemap` by `sitemap.ts`), the
   redirects (`redirects.ts`) and the share card (`ogCard.ts`, `share.ts`).
   `load.ts` is the one Astro-side entry:
   `await wiki()` gives everything, computed once per build. `files.ts` loads
   the same model from disk for `scripts/check-content.ts`, the tests and
   `astro.config.mjs`.
3. **The Markdown pipeline** (`src/lib/markdown/`, wired in
   `astro.config.mjs` through `@astrojs/markdown-remark`'s `unified()`
   processor): remark-wiki-link + `remark-wiki-links` (titles →
   `a.wiki-link` / `span.wiki-link-missing`), then `rehype-external-links`
   (`external-link` on Markdown links off the site, before raw HTML joins
   the tree), `rehype-raw` (raw HTML in content becomes part of the tree),
   `rehype-heading-ids` (Laravel's `Str::slug`, `slug.ts`; ids already in the
   document are never reused), `rehype-callouts` (`> [!NOTE]`, worked on the
   tree), `rehype-images` (sizes, eager/lazy, figures, `zoomable`),
   `rehype-heading-anchors`. Each custom plugin names itself and the file
   when it fails (`named.ts`). `smartypants` is off and there is no syntax
   highlighter: the browser's `code-blocks.js` draws the chrome. `feed.ts` is
   the plain pipeline for feeds, descriptions and llms.txt. `.md` stays `.md`
   (two essays hold `{{ }}` in code blocks); `.mdx` works with the same
   plugins (MDX nodes pass through untouched).
4. **The shell** follows Astro's folders: `src/layouts/Layout.astro` (head,
   GTM, header, Explorer drawer/column, main, rail slot, palette, keys,
   status line, footer, scripts); `src/components/garden/` (`Entry.astro`
   with slots `head`, `before-body`, `after-body`, `after-article`, `body`,
   a `path` for an address that is not the entry's own (`/notes/2`) and
   `extraHeadings` for a view's own h2s; `Head` printing `seo.ts`, `Header`,
   `Explorer`, `Rail`, `Palette`, `Keys`, `Statusline`, `Breadcrumbs`,
   `PageHeader`, `Prose`, `ArchiveRow`, `Button`, `HeadingLink`,
   `GraphControls`); `src/components/notes/` (the stream: `Stream`, `Card`,
   `OneEagerImage`, the note types); `src/styles/` (`site.css`,
   `tokens.css`, `components.css`); `src/scripts/` (`site.js` and
   `site/*.js`, `graph.js`); `src/assets/fonts/` (Aporetic woff2, and `ttf/`
   for the share cards) and `src/assets/icons/` (Heroicons as SVG
   components).
5. **Templates** are `src/pages/`: `index.astro` (home: latest 5),
   `[...slug].astro` (pages collection: `default`, `section`, `publications`),
   `essays|projects|publications/[slug].astro`, `notes/[slug].astro`,
   `notes/[...page].astro` (the landing page + stream, 20 a page, `/notes/2`),
   `notes/type/[type]/[...page].astro`, `404.astro`, and the endpoints
   `graph.json`, `robots.txt`, `llms.txt`, `feed.xml`,
   `essays/feed.xml`, `notes/feed.xml`, `og.png`, `og/[...uri].png`.

Never use `Astro.url` for a page's address: `build.format: 'file'` makes it
`/x.html`. Every component takes `path` or the `Page` and derives it. Paths
to `public/` and the TTFs in bundled code come from `src/lib/paths.ts`
(`import.meta.env.PROJECT_ROOT`, set by `astro.config.mjs`; `process.cwd()`
in plain Node), not `import.meta.url`, which points into `dist/` once bundled.

## Commands

```sh
npm run check            # check:content then check:types
npm run check:content    # astro sync (every file against its schema), then scripts/check-content.ts: wiki links, media, routes, trees, linkable and unique titles
npm run check:types      # astro check: TypeScript in .ts and .astro files (0 errors, 0 warnings expected)
npm run build && npm run preview   # a background server (`astro preview status` / `stop`); :4321, or the next free port
npm run dev              # astro dev (http://localhost:4321); search and the 404's suggestions use the last build's /pagefind, so build once first
                         # there is no global `astro`: use `npm run …` or `npx astro …`
npm run test             # vitest: slugs (tests/fixtures/heading-ids.json), the Markdown, the wiki layer, the head model, the build in dist/
PREVIEW_URL=http://localhost:4321 npm run test:smoke   # browser smoke against the preview (Playwright's browsers come from NixOS: PLAYWRIGHT_BROWSERS_PATH in ~/Projects/nixos, modules/dev/toolchain.nix)
npm run import           # migration: Laravel repo → src/content + src/data (LARAVEL env; --media copies public files); re-runnable
npm run golden           # migration: capture every URL from the local Laravel app (php artisan serve --port=8004, APP_ENV=production)
npm run compare          # migration: golden vs dist, per page; `-- /essays` limits it; `--verbose` prints everything
```

`tests/build.test.ts` reads `dist/` and skips (with a warning) without a
build; the tests that compare with the Laravel site's pages need the golden
set (`npm run golden`, in git-ignored `DEV_FILES/golden`) and skip (with a
warning) without it. The migration scripts (`import-content.mjs`,
`golden.mjs`, `compare.mjs`, `dump-heading-ids.php`) are deleted, with
`node-html-parser`, once the owner accepts the site.

## Authoring

- A page is a file: `src/content/essays/{slug}.md` with `title`, `date`
  (`2026-10-07` or `2026-10-07T09:43:00Z`, stored in UTC and printed in
  `Asia/Kuala_Lumpur`), optional `description`, `image` (`/media/…`, must
  exist in `public/`), `updated`, `draft: true`, and the `seo` group (`title`,
  `description`, `canonical`, `og_type`, `image`, `noindex`, `nofollow`,
  `sitemap: false`, `nosnippet`, `json_ld`). Notes add `type` (text, photo,
  link, quote, video) and the type's fields; publications `outlet`; pages
  `template` and `order` (the pages tree: `order: 0` is the home page).
- Headings start at `##`. Link pages with `[[Title]]` or `[[Title|text]]`
  (`\|` in a table cell); a Markdown link to `/path` counts too. Both feed
  the graph and "Linked from". A title that no published page has renders
  as `wiki-link-missing`; `npm run check:content` reports it.
- **Renaming a page or adding one changes the title index**, which
  `astro.config.mjs` reads once: restart `astro dev` (a build always has the
  current titles). A title can't hold `[`, `]` or `|` (a wiki link couldn't
  name it); `npm run check:content` says so.
- Raw HTML is allowed (`wiki-logo-light`/`-dark`, `wiki-portrait`,
  `<figure class="wiki-pdf">`, `<a class="button">`). Callouts:
  `> [!NOTE] Title` with note, info, tip, important, warning, danger, caution.
- Media is `public/media/…`; the resume is `public/resume/…`; the Aporetic
  fonts are `src/assets/fonts/*.woff2` (hashed by Vite) and
  `src/assets/fonts/ttf/*.ttf` (decompressed from them with fontTools, for
  the share cards).

## Recipes

- **A front-matter field**: add it to the collection's schema in
  `src/content.config.ts` (the one place it is validated); templates read it
  from `page.data`. Only a field
  every page has (like `description`) also goes into the `Page` type
  (`src/lib/types.ts`) and `toPages` (`src/lib/pages.ts`).
- **A collection**: a schema and a `loader('name')` line in
  `src/content.config.ts` (add it to `collections`), an entry in
  `src/data/collections.yaml` (title, route, mount on a landing page), a page
  file `src/pages/{name}/[slug].astro` (copy `essays/[slug].astro`), and an
  item in the `explorer` navigation for its landing page.

## What is native, what is custom

Native: content and data collections (`glob` and `file()` loaders, zod,
`render()`, `headings`), `getStaticPaths`/`paginate`, endpoints, `redirects`
(meta-refresh pages), MDX, `@astrojs/sitemap`, `@astrojs/rss`,
`rehype-external-links`, SVG components, `<script>` bundling,
`is:inline`/`define:vars`, Tailwind through Vite, Pagefind through
`astro-pagefind`, tsconfig path aliases. Custom and unavoidable: the
Markdown plugins, `src/lib/*`, the Pagefind glue in `palette.js`, the satori
share cards, the smoke test and the migration scripts.

Deviations from the Laravel site, by design (see `scripts/compare.mjs`):
`/notes/2` instead of `?page=2`; `og:image` is a satori card (or the raw
image, uncropped) rather than the-og/Glide output; Vite asset names; search is
Pagefind (results come from the last build; result excerpts are Pagefind's);
no PDF redirects: the old blog's PDF addresses
(`/blog/storage/publications/*.pdf`) and the old résumé address
(`/media/career/jotham-lim-resume.pdf`, in `src/data/redirects.yaml`) are not
redirected, and the build log names each one it drops; the feeds are
`@astrojs/rss`'s (item bodies escaped rather than in CDATA, `pubDate` in `GMT`
rather than `+0000`; the same text and dates for a reader); the sitemap is
`@astrojs/sitemap`'s `/sitemap-index.xml` (named in robots.txt) rather than
`/sitemap.xml`; the 404's host/path and suggestions are filled in by the
browser. Google Tag Manager (`site.yaml` `marketing.gtm_id`) is printed as
the addon printed it, in production builds only (`astro dev` has none).

## Review routine

`npm run import -- --media && npm run check && npm run test && npm run build
&& npm run compare`, then `npm run preview`, `npm run test:smoke` and the
browser: dark and light, the drawer below `lg`, a page with
callouts/figures/a PDF, the palette, the graph, `/no-such-page`.
`DEV_FILES/` (git-ignored) holds the import manifest, the golden set,
screenshots and audits. Tooling outside npm (Node, fontTools, Playwright's
browsers) is declared in `~/Projects/nixos`, not installed ad hoc.
