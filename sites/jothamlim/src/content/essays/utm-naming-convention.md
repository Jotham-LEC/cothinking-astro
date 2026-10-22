---
title: "UTM parameters: a naming convention your team will keep"
description: A simple UTM naming convention for small B2B marketing teams, with a template table that lands each link in the right Google Analytics 4 channel.
date: 2026-10-12
updated: 2026-10-15T08:30:50+00:00
---
UTM parameters are tags on the end of a link (`?utm_source=linkedin&utm_medium=social&utm_campaign=…`) that tell Google Analytics where a visitor came from. They work only if everyone tags the same way. A convention your team will keep is short, all lowercase, written on one page, and uses medium values that put each link in the right Google Analytics 4 channel.

## The five parameters you need

Google Analytics 4 [recognizes nine UTM parameters](https://support.google.com/analytics/answer/10917952). Use these:

| Parameter | Answers | Examples |
|---|---|---|
| `utm_source` | Who sent the visitor | `linkedin`, `google`, `newsletter`, `whatsapp` |
| `utm_medium` | What kind of traffic | `social`, `paid-social`, `email`, `cpc`, `referral` |
| `utm_campaign` | Which push | `2026-10-pricing-guide` |
| `utm_content` | Which version of the link | `header-button`, `footer-link`, `video-ad` |
| `utm_term` | The paid keyword | Mostly for search ads |

A small team can ignore `utm_id`, `utm_source_platform`, `utm_creative_format`, and `utm_marketing_tactic`; Google notes the last two are not currently reported.

## Values are case sensitive

[Values are case sensitive](https://support.google.com/analytics/answer/10917952): `google` and `Google` are two sources, and `SpringSale` and `Spring_Sale` are two campaigns. Google recommends lowercase. Without a rule, your report shows `Facebook`, `facebook`, `fb`, and `facebook.com` as four rows.

## Medium decides the channel

GA4 sorts traffic into [default channel groups](https://support.google.com/analytics/answer/9756891) by fixed rules, mostly on `utm_medium`. You cannot edit the rules, but they ignore case.

| Channel | Rule |
|---|---|
| Email | Source or medium is `email`, `e-mail`, `e_mail`, or `e mail` |
| Organic Social | Source is a known social site, or medium is `social`, `social-network`, `social-media`, `sm`, `social network`, or `social media` |
| Paid Social | Source is a known social site and medium contains `cp` (as in `cpc`), is `ppc` or `retargeting`, or starts with `paid` |
| Paid Search | Source is a known search engine and medium matches the same pattern |
| Referral | Medium is `referral`, `app`, or `link` |
| Display | Medium is `display`, `banner`, `expandable`, `interstitial`, or `cpm` |

> [!WARNING] Invented mediums land in Unassigned
> A medium that matches no rule, such as `newsletter` or `linkedin-post`, sends the traffic to **Unassigned**. Pick medium values from the table above.

## Five rules

1. **Lowercase only.**
2. **Hyphens between words**: `pricing-guide`, not `Pricing Guide` or `pricing_guide`.
3. **Source is the place, not the format**: `linkedin`, not `linkedin-video`. The format goes in `utm_content`.
4. **Medium comes from the template below.** Nobody adds one without asking.
5. **Campaign starts with the year and month**: `2026-10-pricing-guide`. It sorts by date and keeps two "webinar" campaigns apart.

## The template

| Where the link goes | `utm_source` | `utm_medium` | `utm_campaign` | `utm_content` (example) | GA4 channel |
|---|---|---|---|---|---|
| LinkedIn post, company page | `linkedin` | `social` | `2026-10-pricing-guide` | `company-post` | Organic Social |
| LinkedIn post, a staff member's profile | `linkedin` | `social` | `2026-10-pricing-guide` | `staff-jotham` | Organic Social |
| LinkedIn sponsored post | `linkedin` | `paid-social` | `2026-10-pricing-guide` | `image-ad` | Paid Social |
| Facebook or Instagram ad | `facebook` or `instagram` | `paid-social` | `2026-10-pricing-guide` | `carousel` | Paid Social |
| Email newsletter | `newsletter` | `email` | `2026-10-monthly` | `header-button` | Email |
| Sales team's email signature | `signature` | `email` | `always-on` | `sales` | Email |
| WhatsApp broadcast or status | `whatsapp` | `social` | `2026-10-pricing-guide` | `broadcast` | Organic Social |
| Partner or directory listing | the partner's name | `referral` | `always-on` | `listing` | Referral |
| QR code on print or at an event | the event's name | `qr` | `2026-11-trade-show` | `booth-banner` | Unassigned |

- **WhatsApp as `social`** keeps it out of Unassigned. To see it separately, build a custom channel group in GA4 later.
- **QR codes land in Unassigned** on purpose: they are rare enough to find by source, and calling them `referral` would muddle a channel you use.
- **Google Ads needs no UTMs** when auto-tagging is on and the account is linked to GA4. Tag Microsoft Ads and other platforms by hand.
- **Never tag links between your own pages.** It overwrites where the visitor came from.

## Keep every link in one sheet

Keep a shared spreadsheet with a column per parameter, drop-down lists for source and medium, and a formula that builds the URL. Every published link gets a row with the date and who made it. Google's [Campaign URL Builder](https://ga-dev-tools.google/campaign-url-builder/) does the same for one-off links. If you shorten links for print or WhatsApp, keep the full version in the sheet.

Use the same source and campaign names in your WhatsApp reference codes; see [[How to connect WhatsApp enquiries to your CRM]].

## How to start

1. Copy the template into a sheet and delete the rows you do not use.
2. Agree the five rules in a ten-minute meeting, not by email.
3. Tag the three most-clicked links: the newsletter's main button, LinkedIn company page posts, and the email signature.
4. After a month, open GA4's Traffic acquisition report by session source / medium. Look for capital letters and Unassigned, and fix the links, not the report.

## What I have seen

As Head of Global Marketing at Moojing, a China-based market-intelligence company, I turned five industry reports into 22 blog articles and 42 LinkedIn posts. With 64 pieces from one source, the question becomes which report and which format brought people in. Only consistent tags answer it: the report in the campaign name, the format in `utm_content`.

For a digital identity-verification platform, I built a marketing site that tracks demo requests. Consistent tags show which channel sent the requests sales wanted, provided someone answers them quickly; see [[Speed to lead: why the first reply decides the deal|speed to lead]].
