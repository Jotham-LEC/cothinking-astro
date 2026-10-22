# jothamlim.com (Astro)

A static Astro 7 site: the digital garden that `~/Projects/jothamlim.com-laravel`
served from Statamic, rebuilt as Markdown content collections with the garden
features (Explorer, `[[wiki links]]`, backlinks, graph, ⌘K search, feeds,
sitemap, JSON-LD, share cards) as a layer over Astro's own Markdown. No CMS, no
server: content is Markdown edited by hand, reviewed locally with
`astro preview`. Full design and inventory: the Laravel repo's
`DEV_FILES/specs/astro-rebuild.md`.

## Read first

How a page is built:

1. **Content** is `src/content/{pages,essays,notes,projects,publications}/{slug}.md`
   (front matter + Markdown), validated by `src/content.config.ts` (zod,
   strict: an unknown key fails the build). `src/data/` holds the **data
   collections**, read by Astro's `file()` loader and validated in the same
   file: `site.yaml` (name, URL, locale, attributes, the Brand/Marketing/
   Settings globals, `feeds`), `collections.yaml` (each content collection's
   title, route, mount, note types, select options, whether its pages are
   articles), `navigation.yaml` (explorer, header, footer trees),
   `redirects.yaml`, `authors.yaml`, and `titles.json` (lower-cased title →
   address, both sites: the `[[wiki link]]` index, a plain JSON import).
   `.astro/` is Astro's generated cache of all this (git-ignored): the source
   is always the Markdown and YAML.
2. **The wiki layer** (`src/lib/`, site-agnostic, no Astro imports except
   `load.ts`) turns entries into `Page`s with addresses (`pages.ts`,
   `urls.ts`), and computes the Explorer (`explorer.ts`), the graph and
   backlinks (`graph.ts`), the outline (`toc.ts`), the pager, the years, the
   note types, breadcrumbs, a page's eyebrow/feed/source (`entry.ts`), the
   head model (`seo.ts`), feeds, robots/llms and the sitemap's entries
   (`textFiles.ts`, fed to `@astrojs/sitemap` by `sitemap.ts`), the
   share card (`ogCard.ts`, `share.ts`) and the content check (`check.ts`).
   `load.ts` is the one Astro-side entry: `await wiki()` gives everything,
   computed once per build. `files.ts` loads the same model from disk for
   `npm run check`, the tests and `astro.config.mjs`.
3. **The Markdown pipeline** (`src/lib/markdown/`, wired in
   `astro.config.mjs` through `@astrojs/markdown-remark`'s `unified()`
   processor): remark-wiki-link + `remark-wiki-links` (titles →
   `a.wiki-link` / `span.wiki-link-missing`), `remark-external-links`
   (`external-link` on links off the site), then `rehype-raw` first (raw HTML
   in content becomes part of the tree), `rehype-heading-ids` (Laravel's
   `Str::slug`, `slug.ts`), `rehype-callouts` (`> [!NOTE]`), `rehype-images`
   (sizes, eager/lazy, figures, `zoomable`), `rehype-heading-anchors`.
   `smartypants` is off and there is no syntax highlighter: the browser's
   `code-blocks.js` draws the chrome. `feed.ts` is the plain pipeline for
   feeds, descriptions and llms.txt. `.md` stays `.md` (two essays hold
   `{{ }}` in code blocks); `.mdx` works with the same plugins.
4. **The shell** follows Astro's folders: `src/layouts/Layout.astro` (head,
   header, Explorer drawer/column, main, rail slot, palette, keys, status
   line, footer, scripts); `src/components/garden/` (the site-agnostic
   pieces: `Entry.astro` with slots `before-body`, `after-body`,
   `after-article`, `body` and `extraHeadings` for a view's own h2s, `Head`
   printing `seo.ts`, `Header`, `Explorer`, `Rail`, `Palette`, `Keys`,
   `Statusline`, `Breadcrumbs`, `PageHeader`, `Prose`, `ArchiveRow`,
   `Button`, `HeadingLink`, `SectionHeading`, `GraphControls`);
   `src/components/notes/` (the stream, this site's own); `src/styles/`
   (`site.css`, `tokens.css`, `components.css`); `src/scripts/` (`site.js`
   and `site/*.js`, `graph.js`); `src/assets/fonts/` (Aporetic woff2, and
   `ttf/` for the share cards) and `src/assets/icons/` (Heroicons as SVG
   components). cothink.ing copies `src/lib`, `src/layouts`,
   `src/components/garden`, `src/styles`, `src/scripts` and `src/assets`.
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
(`process.cwd()`), not `import.meta.url`, which points into `dist/` once bundled.

## Commands

```sh
npm run import           # Laravel repo → src/content + src/data (LARAVEL, SITE env; --media copies public files); re-runnable
npm run check            # the content rules (wiki links, media, routes, front matter, unique titles); rewrites src/data/titles.json
npm run build && npm run preview   # a background server (`astro preview status` / `stop`); :4321, or the next free port
npm run dev              # astro dev (http://localhost:4321); search and the 404's suggestions use the last build's /pagefind, so build once first
                         # there is no global `astro`: use `npm run …` or `npx astro …`
npm run test             # vitest: slug against the golden heading ids, the Markdown tests, the wiki layer, the head model
npm run golden           # capture every URL from the local Laravel app (php artisan serve --port=8004, APP_ENV=production)
npm run compare          # golden vs dist, per page; `-- /essays` limits it; `--verbose` prints everything
PREVIEW_URL=http://localhost:4321 node scripts/smoke.mjs   # browser smoke against the preview (Playwright's browsers come from NixOS: PLAYWRIGHT_BROWSERS_PATH in ~/Projects/nixos, modules/dev/toolchain.nix)
```

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
  as `wiki-link-missing`; `npm run check` reports it.
- **Renaming a page or adding one changes the title index**: run
  `npm run check` (it rewrites `src/data/titles.json`) and restart `astro dev`
  or rebuild. The other site's titles stay in that file from the import.
- Raw HTML is allowed (`wiki-logo-light`/`-dark`, `wiki-portrait`,
  `<figure class="wiki-pdf">`, `<a class="button">`). Callouts:
  `> [!NOTE] Title` with note, info, tip, important, warning, danger, caution.
- Media is `public/media/…`; the resume is `public/resume/…`; the Aporetic
  fonts are `src/assets/fonts/*.woff2` (hashed by Vite) and
  `src/assets/fonts/ttf/*.ttf` (decompressed from them with fontTools, for
  the share cards).

## What is native, what is custom

Native: content and data collections (`glob` and `file()` loaders, zod,
`render()`, `headings`),
`getStaticPaths`/`paginate`, endpoints, `redirects` (meta-refresh pages),
MDX, `@astrojs/sitemap`, SVG components, `<script>` bundling,
`is:inline`/`define:vars`, Tailwind through Vite, Pagefind through
`astro-pagefind`. Custom and unavoidable: the
Markdown plugins, `src/lib/*`, the Pagefind glue in `palette.js`, the satori
share cards, the import/golden/compare/smoke scripts.

Deviations from the Laravel site, by design (see `scripts/compare.mjs`):
`/notes/2` instead of `?page=2`; `og:image` is a satori card (or the raw
image, uncropped) rather than the-og/Glide output; Vite asset names; search is
Pagefind (results come from the last build; result excerpts are Pagefind's);
no PDF redirects: the old blog's PDF addresses
(`/blog/storage/publications/*.pdf`) and the old résumé address
(`/media/career/jotham-lim-resume.pdf`, in `src/data/redirects.yaml`) are not
redirected, and the build log names each one it drops; the sitemap is `@astrojs/sitemap`'s `/sitemap-index.xml` (named in
robots.txt) rather than `/sitemap.xml`; the 404's host/path and suggestions
are filled in by the browser. Google Tag Manager (`site.yaml`
`marketing.gtm_id`) is printed as the addon printed it, in production builds
only (`astro dev` has none).

## Review routine

`npm run import -- --media && npm run check && npm run test && npm run build
&& npm run compare`, then `npm run preview` and the browser: dark and light,
the drawer below `lg`, a page with callouts/figures/a PDF, the palette, the
graph, `/no-such-page`. `DEV_FILES/` (git-ignored) holds the import manifest,
the golden set and screenshots. Tooling outside npm (Node, fontTools,
Playwright's browsers) is declared in `~/Projects/nixos`, not installed ad hoc.
