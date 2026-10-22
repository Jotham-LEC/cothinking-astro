---
title: "Setting up IT for a small company, Part 3: Password managers"
description: Why a business of up to 50 staff should adopt a password manager first, and why 1Password is the one to choose, with prices and a decision tree.
date: 2026-10-18
updated: 2026-10-21T04:22:02+00:00
author: jotham-lim
category: setting-up-it
series: The Boring Office
part: 3
---
## Why a password manager comes first

A new company has a dozen accounts or more within its first month:

- The accounting system.
- The Google Workspace or Microsoft 365 admin account.
- The domain registrar, the DNS provider, and the web host.
- The backup service.
- Online banking, LHDN, KWSP, and PERKESO.
- GitHub, AI tools, online marketplaces, and social media.

Many are shared as staff join. Most small companies reuse passwords or keep them in someone's head, so every account is as weak as the weakest site that shares its password.

A password manager stores each password once, fills it in, and shares it only with the people who need it. When someone leaves, their access ends with their account. It costs a few dollars a month, and it is easiest to start while the company is small: moving 10 people and several hundred passwords later is a project of its own.

## Decide who holds the passwords

Decide this before the software:

- **Each person holds their own.** Everyone keeps a personal vault, and the company shares a few logins through a shared vault. Simpler, and enough for many small companies.
- **The company holds them.** The company owns every vault, decides who sees what, and can take access back. Better once you have staff, shared logins, or logins that must outlast whoever made them.

1Password supports both arrangements.

## Which password manager to use

<img class="wiki-logo-light" src="/media/diagrams/boring-office-passwords.svg" alt="Decision tree: one person uses 1Password Individual. A team uses the 1Password Teams Starter Pack, unless cost decides the matter, in which case it runs Vaultwarden on a VPS." loading="lazy" decoding="async">
<img class="wiki-logo-dark" src="/media/diagrams/boring-office-passwords-dark.svg" alt="" loading="lazy" decoding="async">

- **One person: 1Password Individual.** Mature, easy to use, and useful with no setup.
- **A team of up to 10: the 1Password Teams Starter Pack.** A flat monthly price covers 10 people.
- **A team of more than 10, or one that needs single sign-on: 1Password Business.**
- **A team for which cost is decisive: Vaultwarden.** A free, unofficial server for Bitwarden's apps, run on a rented virtual private server (VPS). It costs less and keeps the data on a server you control, but its updates and backups are yours to do.
- **One technical person who wants everything offline: KeePass.** One encrypted file; no server, no subscription.

## Prices on 18 October 2026

Prices are in US dollars a month, billed yearly.

| Plan | Price | Covers |
|---|---|---|
| 1Password Individual | $3.99 | One person ([1Password](https://1password.com/pricing/personal)) |
| 1Password Teams Starter Pack | $24.95 | Up to 10 people; further seats cost $4.99 each, to a maximum of 20 ([1Password](https://1password.com/pricing/business)) |
| 1Password Business | $8.99 a person | Single sign-on and further administrative controls |
| Vaultwarden | $0 | The cost of the VPS, typically a few dollars a month |

## Choosing a VPS for Vaultwarden

Choose a provider that bills by the hour, asks for no long contract, and is large enough that it is unlikely to close. I use [Hetzner](https://www.hetzner.com/cloud/): cheap in Germany, and good value in Singapore, its nearest location to Malaysia.

## Setting it up

- Turn on two-factor authentication for the password manager itself.
- Appoint two administrators, so the company keeps access when one is away.
- Group shared logins by department, such as Finance, Sales, and Administration, and give each person only the groups their work requires.
- Plan for an emergency in which a spouse or co-owner needs access. 1Password's [Emergency Kit](https://support.1password.com/emergency-kit/) explains the options.

---

## See also

- [[Setting up IT for a small company, Part 1: The Boring Office]]
- [[Business email compromise in Malaysia: how invoice fraud works]]
