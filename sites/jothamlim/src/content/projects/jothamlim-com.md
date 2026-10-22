---
title: jothamlim.com
description: "This website and cothink.ing: two Statamic 6 sites from one Laravel app."
date: 2026-09-28
updated: 2026-10-08T09:28:46+00:00
---
This website, and [[CoThinking]]'s next door: two Statamic 6 sites served by one Laravel app. This one is a digital garden after Obsidian Publish, with an Explorer, wiki links, backlinks and a graph of what links to what. cothink.ing is a business site built from the same templates and branded by its own site settings.

Content lives in SQLite through Statamic's Eloquent driver and is written in the control panel, while the content model (collections, blueprints, navigation) is YAML in Git. Templates are Blade with Statamic's tag components, styled with Tailwind v4, every colour one `light-dark()` token, so there is no dark-mode variant anywhere. SEO, redirects, the sitemap, share cards and analytics come from my [[Marketing Toolkit]] addon, and nightly encrypted off-site backups from [[laravel-offsite-backup]].

A push to `main` runs the tests and deploys with Deployer to a VPS behind Caddy, snapshotting the database before it migrates. The terminal touches stay from earlier versions: vim keys, a status line drawn like my tmux bar, archives as `ls -l` rows.

## Decisions

The previous version was a flat-file Markdown wiki on Laradocs, with Git as the only source of truth. It moved to Statamic in October 2026 to serve the business site from the same install, and as practice for the multi-brand Statamic sites I build for clients: a brand is its site settings and its own content, not a fork of the code. Before Laradocs it ran Filament, Livewire and Turbo with 3,800 lines of custom CSS and JavaScript, which is why it is still Blade first, with JavaScript only where a feature needs it.

## Time Machine

Past versions of this website across time:

- **v9** Statamic 6 (current)
- **v8** Laravel + Laradocs
- **v7** Laravel + TuiCSS: [visit ↗](https://jotham-lec.github.io/v7-laravel-tuicss-945/)
- **v6** Bricks Builder + WordPress: [visit ↗](https://jothamlimcom-v2.pages.dev/)
- **v5** Hugo 386: [visit ↗](https://jothamlim-com-v4.pages.dev/)
- **v4** Astro Erudite: [visit ↗](https://jotham-lec.github.io/v4-astro-erudite-121/)
- **v3** Hugo Hextra: [visit ↗](https://hugo-hextra.pages.dev/)
- **v2** Hugo: [visit ↗](https://cothinking-hugo.pages.dev/)

## Links

The repository is private, but the [v4](https://github.com/Jotham-LEC/v4-astro-erudite-121) and [v7](https://github.com/Jotham-LEC/v7-laravel-tuicss-945) snapshots are public, and the posts on [[Why I Chose Hugo for My Personal Website|choosing Hugo]], [[Building a Personal Website — Why I Chose Obsidian Publish|choosing Obsidian Publish]] and [[Why Am I Migrating to Micro.Blog?|moving to Micro.blog]] are still here.
