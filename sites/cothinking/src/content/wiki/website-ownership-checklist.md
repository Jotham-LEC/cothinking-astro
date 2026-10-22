---
title: "Website ownership checklist: who should hold your domain, hosting and analytics"
description: Your company, not your vendor, should own the domain, DNS, hosting, email admin and analytics. A checklist of every account and who should hold it.
date: 2026-10-12
updated: 2026-10-15T01:20:18+00:00
category: ownership-and-compliance
related_pages:
  - problems/recover-your-domain-from-an-old-vendor
seo:
  title: "Website ownership checklist: domain, hosting and analytics"
---
Your company should be the owner of record for every account your website and email depend on: the domain, DNS, hosting, email admin, analytics, Search Console, and ad accounts. Your web vendor gets its own login with the access it needs, which you remove on the day you part ways. If the vendor's name is on the domain, or the only admin login is theirs, you are renting your website from them.

## How it goes wrong

The vendor offers to "handle everything" and buys the domain, hosting, and email on its own account. Years later the person who set it up has left, the invoices are still paid, and nobody at the company can log in. You find out when something breaks:

- email stops because a card expired on an account you can't see;
- you want to change vendors and the old one goes quiet;
- a new tool needs a DNS record and there is no one to ask.

In a business of up to 50 staff, it usually falls to you as the owner to sort out, even when sales or marketing runs the website day to day.

## Who should hold each account

| Account | Owner of record | Vendor's access |
| --- | --- | --- |
| Domain registrar (`.com.my`, `.my`, `.com`) | The company, on a company email address | None, or a separate user if the registrar allows |
| DNS (often the registrar, sometimes Cloudflare) | The company | Its own user, removable |
| Hosting or server | The company, billed to the company | Its own user or SSH key |
| Website admin (WordPress, Statamic, etc.) | A named staff member as administrator | Its own admin account |
| Email admin (Google Workspace or Microsoft 365) | Two people at the company as super admins / global admins | Its own admin account, scoped if possible |
| Google Analytics | The company as Administrator | Editor or Administrator, its own login |
| Google Search Console | The company as a verified owner | Full user or delegated owner |
| Google Business Profile | The company as owner | Manager |
| Google Ads, Meta, LinkedIn ad accounts | The company, on the company's billing | Partner or user access |
| Code repository and backups | The company, or a copy the company holds | Contributor |

Three rules sit behind the table:

1. **Accounts belong to role addresses, not people.** Use a mailbox two people can read, such as `it@yourcompany.com.my`. A domain registered to a staff member's personal Gmail leaves with them.
2. **Everyone gets their own login.** No shared passwords. When someone leaves, you remove one user and nothing else breaks.
3. **The company pays.** Whoever holds the billing tends to end up holding the account. Put renewals on a company card and know the dates.

## The domain comes first

Everything else depends on the domain, and it is the one thing you can't replace: it carries your email addresses, the links in old proposals, and your search history.

<img class="wiki-logo-light" src="/media/diagrams/website-ownership-checklist-domain.svg" alt="The domain's DNS points to the website and the email, and verifies Search Console, so whoever holds the domain controls all three" loading="lazy" decoding="async">
<img class="wiki-logo-dark" src="/media/diagrams/website-ownership-checklist-domain-dark.svg" alt="" loading="lazy" decoding="async">

For a `.com.my`, MYNIC asks organisations for their SSM registration documents, so the registrant should be your company's exact legal name ([MYNIC's FAQ](https://mynic.my/faq)). If your registrar shows the vendor's company or an individual, ask for it to be changed. Check the renewal date too, and turn on auto-renew.

## Email admin needs two people

Google advises that "your organization should have more than one super administrator account, each managed by a separate individual", each with 2-Step Verification ([Google](https://knowledge.workspace.google.com/admin/users/security-best-practices-for-administrator-accounts)). The same applies to Microsoft 365's Global Administrator. With one admin, a resignation or a lost phone leaves you proving to Google or Microsoft that you own your own company. Have two admins at the company, both with two-factor authentication, and the vendor as a third if it does the day-to-day work.

## Analytics and Search Console hold data you can't recreate

In Google Analytics, only an Administrator can add or remove users, and the last Administrator can't delete themselves ([Google](https://support.google.com/analytics/answer/9305788)). Make sure that person works for you.

In Search Console, if the only verified owner leaves, verify ownership yourself; if all verified owners are removed, every other user and delegated owner loses access ([Google](https://support.google.com/webmasters/answer/7687615)). Verify with a DNS record on your own domain, from a company account. It survives a redesign and a change of vendor.

## How to get it back

1. **List what you know.** Domain names, where the site is hosted, who sends the invoices, and which logins anyone at the company has.
2. **Look up the domain.** WHOIS shows at least the registrar. If it doesn't show the registrant, ask the vendor.
3. **Ask in writing.** Ask the vendor to move the domain into an account in your company's name and to add your users to the hosting, email admin, analytics, and Search Console. In my experience, vendors hold these accounts through oversight far more often than by design.
4. **Change the passwords and add two-factor authentication** on everything you receive. Remove logins nobody can explain.
5. **Write it down.** One document listing each account, its URL, the owner of record, who has access, the renewal date, and the cost. Keep the passwords in a password manager, not in the document.

If the vendor won't cooperate, your route is through the registrar, and the registrar deals with the registrant. That is one more reason the registrant must be you. The steps I take are in [[Recover your domain from an old vendor]].

> [!NOTE]
> Taking ownership doesn't mean firing your vendor. It means the vendor works on accounts you own, and a change of vendor becomes a change of one login.

## An example

A Malaysian distributor of commercial kitchen and foodservice equipment, with two brands, came to me in May 2026. Its previous vendor held the domain, the hosting, and the email accounts. Before any design work, I:

- recovered every account, put it in the company's name, and documented who has access;
- moved both brands onto one server;
- set up SPF, DKIM, and DMARC (see [[What is DMARC?]]), with login verification and spam protection for all staff;
- moved one brand's staff from free webmail to business email on the company's domain.

## Check it once a year

Set a yearly reminder and go through the table. People leave, vendors change, and someone adds a tool with a personal login. If email is the weak spot, start with [[Why are our emails going to spam?]] and [[Business email compromise in Malaysia: how invoice fraud works]].
