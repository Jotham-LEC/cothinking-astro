---
title: How to choose an IT support provider for a small company
description: What managed IT covers, remote vs on-site, per-user prices in Malaysia, what an SLA's reply and fix times mean, and who should hold the admin accounts.
date: 2026-10-12
updated: 2026-10-15T08:30:50+00:00
category: choosing-a-provider
author: jotham-lim
related_pages:
  - cothinking_pages/how-i-work
---
Choose an IT support provider by what they take responsibility for, not by the monthly price: what they cover, how fast they reply and fix, how much on-site time you get, and what security they insist on. Before you sign, make sure the admin accounts stay in your company's name.

## What managed IT covers

A fixed monthly fee for a defined set of work. For a business of up to 50 staff it usually covers:

- a helpdesk for staff (passwords, printers, Outlook),
- devices: patching, endpoint protection, and a list of who has which machine,
- Google Workspace or Microsoft 365 users, sharing, and spam protection,
- the router, Wi-Fi, and firewall,
- servers and backups, if you have them,
- monitoring alerts and a monthly report.

Usually excluded: hardware, licences, cabling, office moves, and projects such as an email migration. Ask for the exclusions in writing.

## On-site hours matter if you have local equipment

Most support is remote. If you run a server, a shared printer, or a CCTV recorder, buy on-site hours from a provider close enough to use them. If everyone works on laptops in the cloud, remote-only may be enough.

## What it costs in Malaysia

| Model | How it is charged | Suits |
| --- | --- | --- |
| Per user or device | Monthly fee per person or PC, often with a minimum | One predictable bill |
| Block of hours | Set hours a month, extra hours billed | Few devices, occasional needs |
| Ad hoc | Per call-out or hour, no contract | Very small teams, or a stopgap |
| Per job | A price for each job, agreed before it starts, with an optional Care Plan for a website | Businesses whose needs come and go |

The last model is the one I use, and [How I work](/how-i-work) describes it.

Published examples, October 2026:

- One firm: RM99 per user with no on-site hours, RM149 with 4 hours a month, RM199 with 8; minimums of RM1,500 to RM5,000 a month, plus an onboarding fee.
- Another: RM900 a month for 10 to 14 PCs with 4 on-site hours, up to RM2,200 for 26 to 30 PCs with 16 hours.

So roughly RM65 to RM200 per user or PC a month. Most providers publish no prices: compare quotations item by item, and check them for the [[Red flags in a website or IT quotation]].

## An SLA has two times: reply and fix

| Term | Means | Ask |
| --- | --- | --- |
| Response (reply) time | Someone acknowledges the ticket | A person, or an automatic email? |
| Resolution (fix) time | The problem is solved | Promised, or only a target? |

A good SLA also varies the times by priority, says when the clock runs (8am to 6pm on working days is common), and says what you get if they miss. An uptime of 99.9% a month still allows about 43 minutes of downtime; 99.5% allows about 3.6 hours.

## The security they should insist on

1. **Two-step verification** on every account. [Microsoft's own research](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/best-practices) (2019) found that it makes an account 99.9% less likely to be compromised.
2. **Scheduled patching** of systems, browsers, and router firmware.
3. **Tested backups.** Malaysia's National Cyber Security Agency advises backing up critical data "ideally ... daily, on a separate media and stored offline at an alternate site" ([NACSA](https://nacsa.gov.my/advisory9.php)).
4. **SPF, DKIM, and DMARC** on your domain (see [[What is DMARC?]]).
5. **Leavers handled the same day.**
6. **A breach plan.** Since 1 June 2025 a breach must be reported to the Personal Data Protection Commissioner within 72 hours (see [[PDPA amendments: what sales and marketing teams must change]]).

## Your company should hold the admin accounts

<img class="wiki-logo-light" src="/media/diagrams/how-to-choose-an-it-support-provider-admin-accounts.svg" alt="Your company owns the top-level admin accounts and pays for the licences; the provider works through its own named admin accounts, which you grant and can remove.">
<img class="wiki-logo-dark" src="/media/diagrams/how-to-choose-an-it-support-provider-admin-accounts-dark.svg" alt="">

- **Yours:** the Google Workspace super admin or Microsoft 365 Global Administrator, the domain registrar, the firewall, and the backup service. Microsoft recommends fewer than five Global Administrators and two emergency "break glass" accounts ([Microsoft](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/best-practices)).
- **The provider's:** its own named admin accounts, which you can remove. A Microsoft partner should use GDAP, "granular and time-bound access" that you "must explicitly grant" ([Microsoft](https://learn.microsoft.com/en-us/partner-center/customers/gdap-introduction)).
- **A written list** of every account and who has access. The [[Website ownership checklist: who should hold your domain, hosting and analytics]] covers the website.

> [!WARNING] Licences must be billed to you
> If the provider buys licences on its own account and re-bills you, leaving it can mean losing your mailboxes.

## Managed IT fits the middle

- **About eight people** on laptops and Google Workspace: a capable staff member and an occasional technician may be enough.
- **About 60 people** with a server and an accounting system: an IT person on staff, with a provider for nights and holidays.
- **In between**: managed IT.

## What I have seen

A Malaysian distributor of commercial kitchen equipment came to me in May 2026 after its previous vendor had kept the domain, hosting, and email accounts. I recovered them, documented who has access to what, and wrote an operations manual so whoever comes next can take over.

## Order of work

1. List your devices, accounts, and the systems you can't work without.
2. Decide between remote-only and some on-site hours.
3. Compare two or three quotations.
4. Ask the [[Questions to ask an IT support provider before you sign]].
5. Make sure the admin accounts are yours before you sign.
