---
title: "Setting up IT for a small company, Part 2: The domain and accounts"
description: How a small company should register its domain, choose a registrar and DNS provider, and keep every account it depends on in its own name.
date: 2026-10-18
updated: 2026-10-21T04:22:02+00:00
category: setting-up-it
series: The Boring Office
part: 2
---
## Why the domain comes first

The domain's DNS records point to the website, deliver the email, and prove ownership to Google, Microsoft and others. Whoever controls the domain controls all of them, and losing it can take the website and the email down at once. See [[Website ownership checklist: who should hold your domain, hosting and analytics]].

## Register it yourself, in the company's name

- **The registrant is the company.** The name on the registration should be the company's, exactly as it appears on its SSM certificate. For a `.com.my` domain, MYNIC requires this ([MYNIC Registrant Policy](https://mynic.my/storage/pdf/MYNIC_Registrant_Policy.pdf)).
- **The account belongs to the company.** Open the registrar account with a company email address, not a personal one or a vendor's, and store its login in the company's password manager ([[Setting up IT for a small company, Part 3: Password managers|Part 3]]).
- **Renewal is automatic.** Turn on automatic renewal and pay with a company card. Registering for several years reduces the risk of a missed renewal.
- **The transfer lock is on.** It prevents the domain from being moved to another registrar without the account holder's approval.
- **A developer or agency never registers it on your behalf.** If one needs access, add them as a user of the company's account, and remove them when the work ends.

## Which registrar to use

A registrar sells the domain and renews it.

| Tier | Registrars | Use for |
|---|---|---|
| 1 | [Porkbun](https://porkbun.com/), [Cloudflare](https://www.cloudflare.com/domains/), [Namecheap](https://www.namecheap.com/) | `.com` and most international domains |
| 2 | [Shinjiru](https://www.shinjiru.com.my/), [Exabytes](https://www.exabytes.my/) | `.com.my` domains |

- **`.com.my` requires a Malaysian registrar.** None of the Tier 1 registrars sells `.com.my`. Exabytes and Shinjiru do, and are the two largest Malaysian registrars by MYNIC's 2024 figures ([MYNIC](https://mynic.my/storage/postfile/file/20250204/Registrars_Performance.pdf)). A `.com.my` domain is open only to a business registered with SSM, costs about RM60 to RM80 a year, and can be registered for up to 10 years. SSM's [Go.MY](https://ssm.com.my/Pages/Domain_Registration.aspx) offer reduces the first year for a newly registered business.
- **Cloudflare sells domains at cost**, with no markup, but every domain registered there must use Cloudflare's DNS ([Cloudflare](https://developers.cloudflare.com/registrar/faq/)). This suits the recommendation below.

## Which DNS provider to use

DNS is the service that holds the domain's records. Use **[Cloudflare](https://www.cloudflare.com/)**: its free plan is fast and reliable, and its dashboard is clear. A domain registered elsewhere, including a `.com.my`, can still use Cloudflare's DNS. Where Cloudflare isn't an option, use the registrar's own DNS.

## The other accounts the company must own

The same rules apply to every account the company depends on:

- The Google Workspace or Microsoft 365 administrator account.
- The web host and any servers.
- Online banking, LHDN (MyTax and MyInvois), KWSP, PERKESO, and HRD Corp.
- The accounting system.
- Google Business Profile, social media pages, and online marketplaces.
- The CRM and any other system that holds customers' or suppliers' details.

For each account:

1. Register it with a company email address.
2. Appoint at least two administrators.
3. Turn on two-factor authentication.
4. Store the login in the company's password manager.

## Keep an access register

An access register is a single table, kept where the owner and one other person can find it, with one row for each account:

| Service | Address | Registered to | Administrators | Two-factor method | Renewal date |
|---|---|---|---|---|---|
| Domain (Porkbun) | porkbun.com | admin@ | Owner, office manager | Authenticator app | 2027-10-18 |

It turns a departing employee or a lost password into a routine task rather than a search. Update it whenever an account is opened, closed, or handed over.

---

## See also

- [[Setting up IT for a small company, Part 1: The Boring Office]]
- [[Website ownership checklist: who should hold your domain, hosting and analytics]]
