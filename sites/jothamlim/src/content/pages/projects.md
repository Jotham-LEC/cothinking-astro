---
title: Projects
description: "Things I have built and how I work: marketing systems, websites and tools I made single-handedly, and why each is shaped the way it is."
updated: 2026-10-15T06:26:38+00:00
order: 4
---

I run marketing for a living and write code to get leverage. These are the systems, websites and tools I have built, all of them single-handedly, and each entry says what the thing is and why it is shaped that way.

## Marketing operations

Since 2025 I have run global marketing for a B2B market-intelligence business. The department is small, so the operating system is an agent and a handful of repositories.

- **[[Command-and-control workbench]].** A repo where I sit with an agent to read team chat and build deliverables: HTML reports, press kits and gated industry reports, written in org-mode and compiled through LaTeX to PDF.
- **[[Single source of truth]].** Company, product, brand, compliance, market and glossary facts, authored once and read by every other repo.
- **[[Agent-run digests]].** Two unattended bots with no LLM API key and no cron. One scores report-download leads and posts a weekly shortlist to sales, and the other turns fifty chat groups into a morning brief.
- **Outreach.** Cold email, a LinkedIn ladder and journalist PR run off one shared ledger, so nobody is contacted twice. The drip sends from an isolated domain, which carries a zero-JavaScript credibility page.
- **The production site.** Articles and gated reports bring search traffic, downloads become leads, and leads are enriched, scored and synced to the CRM. An HMAC-signed API feeds the digests.

## Websites

Marketing sites I have planned, written, designed and built since 2023. The ones I build for clients are on [CoThinking's Work page](https://cothink.ing/work), Innov8tif, Pixaproof and Blue Education among them, with the case study of [[Ultimate Circle]]: IT recovered from a vendor who held the accounts, and a catalogue of about 400 products.

In-house:

- **2026 · A global marketing site**: for the China-based market-intelligence company where I run marketing.
- **2023 · [ORLIG](https://orlig.com)** and **[Anbiz](https://anbiz.com)**: where I learnt the job.

## Open source and tooling

- **[[Marketing Toolkit]].** A Statamic addon that puts SEO, redirects, 404s, SEO reports, tracking tags and Consent Mode in the control panel, so marketing owns them. Free on Packagist, and on every Statamic site I build.
- **[[laravel-offsite-backup]].** A Deployer recipe and hardened preset for spatie/laravel-backup, with pre-flight checks and restore drills run off the server, written after finding out app by app that "we have backups" was not true.
- **[[greyline]].** A live world-time wallpaper for Wayland and X11, after the ThinkPad World Time desktop.
- **[deployer-laravel-stack](https://github.com/Jotham-LEC/deployer-laravel-stack).** A Deployer recipe that provisions Caddy, PHP 8.4, Postgres or SQLite, Redis, UFW and fail2ban on a fresh Ubuntu box, then deploys with zero downtime.
- **NixOS configuration.** One ThinkPad, declared with flake-parts and import-tree so that one topic is one file. Secrets in sops, five packages nixpkgs lacks, and Doom Emacs built from the repo.
- **[org-retroclock](https://github.com/Jotham-LEC/org-retroclock).** An Emacs package that logs the hour you already spent. Org clocks the present tense, so work you finished without clocking it had no command at all; this writes the entry that was never there.
- **[persp-mode-tab-bar](https://github.com/Jotham-LEC/persp-mode-tab-bar).** An Emacs package that draws your workspaces in the tab bar, where the only answer to which one you are in used to be a message that scrolled away. It shares the tab bar with whatever else is already drawing there.
- **[mu4e-send-later](https://github.com/Jotham-LEC/mu4e-send-later).** Schedule mail in mu4e and close Emacs: when it is due, a systemd or launchd timer starts a background Emacs that sends it. A failed send is retried and kept, never dropped.
- **Editor Themes.** Ten editor colour schemes for the Statamic 6 control panel, light and dark, from Catppuccin to Tokyo Night, published from the control panel itself.
- **[[jothamlim.com|This website]].** Two sites from one Statamic 6 install: this digital garden and [[CoThinking]]'s business site.

## Personal

- **Wedding command centre.** Our wedding as a repository: an org-mode work breakdown with owners and dependencies, a decision log, a budget where every figure cites a receipt, and an agent brief that opens with "be Jarvis".
- **Wedding RSVP site.** Laravel, Inertia, React and Filament. The form saves a draft at every step, so nobody is lost halfway.
