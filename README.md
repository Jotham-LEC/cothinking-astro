# cothinking-astro

The source of [jothamlim.com](https://jothamlim.com) and
[cothink.ing](https://cothink.ing): two [Astro](https://astro.build) sites
that share one layer of code, `packages/garden`.

## Quick start

You need Node 22.23.4 or newer (what Astro 7.4 requires; CI uses 24) and npm.

```sh
npm install
npm run dev          # jothamlim.com at http://localhost:4321, cothink.ing at :4322
npm run stop         # when you are done
```

## Write a page

A page is a Markdown file in `sites/<site>/src/content/<collection>/`, named
with lower-case letters, digits and dashes: that name is its address. For
an essay on jothamlim.com:

```md
---
title: Why I write
date: 2026-10-22
description: One line, for search results and the share card.
image: ../../assets/media/essays/why-i-write/cover.jpg
---

## The reason

Link other pages by title, on either site: [[Writing shorter]], or by
their file, which Emacs follows with C-c C-o: [Writing shorter](../notes/writing-shorter.md).
```

Pictures go under `sites/<site>/src/assets/media/` and are referenced with a
relative path; Astro resizes and optimises them. `draft: true` keeps a page
out of the build.

## Check, build, deploy

```sh
npm run check        # types
npm test             # the code, and every page's links and references
npm run build        # both sites into sites/<site>/dist
npm run preview      # the build at :4331 and :4332
```

There is no manual deploy: every push to `main` checks, builds, tests and
deploys both sites to Cloudflare (`.github/workflows/deploy.yml`).

## Where to go next

`AGENTS.md` is the map: how a page is built, what the garden is, the
recipes for a new page, collection, behaviour or site, and how to verify a
change.
