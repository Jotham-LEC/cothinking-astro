---
title: Marketing Toolkit
description: A Statamic addon that hands SEO, redirects, 404s, reports and tracking to the marketing team.
date: 2026-10-05
updated: 2026-10-08T09:28:46+00:00
---
I run marketing, and on every site I worked on, SEO sat behind a developer: a title change was a ticket, a moved page became a 404, and the tracking tags were whatever someone last pasted into the layout. The Marketing Toolkit is a Statamic addon that puts all of it in the control panel, where marketing can own it.

- **SEO, with defaults.** Every page gets its title, description, canonical, Open Graph, JSON-LD, sitemap entry, robots.txt and llms.txt without anyone filling in a field. Each can be changed on the page's SEO tab, with a preview of the Google result and the share cards as you type.
- **Redirects and 404s.** Moving a page adds its 301, and the missing pages real visitors hit are logged with the page that linked there. Wildcards, 410s and CSV import.
- **Reports.** Every page is checked and scored out of 100, and each problem links to the entry that fixes it. Signed in, a toolbar on the live site shows the same for the page you are on.
- **Tracking and Consent Mode.** GTM, GA4, PostHog, Meta Pixel or LinkedIn by ID, printed in production only, with Consent Mode v2 defaults per region. Search Console numbers per page, and form submissions sent on as leads with their source.

For developers it is two tags in the layout, `<s:mt:head />` and `<s:mt:body />`, built from Statamic's own fieldsets, globals and tags, with no front-end script unless a feature needs one. A feature switched off is not loaded at all.

It began as Co-SEO, an addon for this site, and grew as I moved the sites I build onto Statamic; it now runs on all of them. I build it with heavy AI assistance and say so in the README: every change goes through the test suite and CI on SQLite and Postgres. It is MIT-licensed, with no editions and no licence key.

## Links

- [Repository and documentation](https://github.com/Jotham-LEC/statamic-marketing-toolkit)
- [Packagist](https://packagist.org/packages/jotham-lec/statamic-marketing-toolkit)
- [Statamic Marketplace](https://statamic.com/creators/jothamlec)