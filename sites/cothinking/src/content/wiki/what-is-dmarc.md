---
title: What is DMARC?
description: DMARC is a DNS record telling inboxes what to do with email that claims to be from your domain but fails SPF and DKIM. How it works and how to set it up.
date: 2026-10-12
updated: 2026-10-15T08:30:50+00:00
category: email-and-security
related_pages:
  - problems/emails-going-to-spam
---
DMARC is a TXT record in your domain's DNS that tells receiving servers what to do with email that claims to come from your domain but can't prove it. It adds two things to SPF and DKIM: the proof must match the From address your recipient sees, and receivers send you reports of who sends email in your name.

## SPF, DKIM, and DMARC work together

- **SPF** lists the servers allowed to send email for your domain.
- **DKIM** signs each email. The receiver checks the signature against a public key in your DNS and knows the message wasn't changed on the way.
- **DMARC** requires the domain in the visible From address to match a domain that passed SPF or DKIM, and says what to do with email that fails.

That match is called alignment. A scammer can pass SPF and DKIM on a domain of their own; alignment ties the check to the address your customer reads.

<img class="wiki-logo-light" src="/media/diagrams/email-authentication.svg" alt="A receiving server checks SPF and DKIM, then DMARC asks whether a passing check matches the From domain: if yes the email goes to the inbox, if no your policy decides" loading="lazy" decoding="async">
<img class="wiki-logo-dark" src="/media/diagrams/email-authentication-dark.svg" alt="" loading="lazy" decoding="async">

## What the record looks like

It is a TXT record at `_dmarc.yourdomain.com.my`. A sensible first record:

```text
v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com.my
```

- `p=` is the policy: `none` (report only), `quarantine` (send to spam), or `reject` (refuse).
- `rua=` is where receivers send daily aggregate reports.
- Others you may meet: `sp` (policy for subdomains), `adkim` and `aspf` (strict or relaxed alignment; relaxed, the default, is usually right), and `ruf` (failure reports, which few receivers send).

## The standard changed in May 2026

[RFC 9989](https://www.rfc-editor.org/rfc/rfc9989.html) replaces RFC 7489 and moves DMARC onto the Standards Track. Three changes matter:

- `pct` (apply the policy to a percentage of email) is gone; `t=y` puts the record in test mode instead.
- `np` sets a policy for subdomains that don't exist, which scammers like to invent.
- Receivers find your organizational domain by walking up the DNS, which matters for `.com.my` domains, three labels deep.

Help pages and receivers lag: Google's DMARC page still recommends `pct` ([Google](https://knowledge.workspace.google.com/admin/security/set-up-dmarc)). Check your tools support the new tags before using them.

## How to set it up

Each step is a DNS change, made wherever your DNS is hosted.

::::steps
1. **List everything that sends email as your domain:** mailboxes, contact form, newsletter tool, CRM, and accounting system.
2. **Publish one SPF record** covering them. Google Workspace: `v=spf1 include:_spf.google.com ~all` ([Google](https://knowledge.workspace.google.com/admin/security/set-up-spf)). Microsoft 365: `v=spf1 include:spf.protection.outlook.com -all` ([Microsoft](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-spf-configure)). Add each other sender's `include:`. Keep to one record and 10 DNS lookups, or it fails.
3. **Turn on DKIM** for your mailboxes and each tool.

   :::tabs
   ::tab[Google Workspace]
   Admin console → Apps → Google Workspace → Gmail → Authenticate email, with a 2048-bit key ([Google](https://knowledge.workspace.google.com/admin/security/set-up-dkim)).

   ::tab[Microsoft 365]
   Defender portal → Email & collaboration → Policies & rules → Threat policies → Email authentication settings → DKIM, which asks for two CNAME records ([Microsoft](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-dkim-configure)).
   :::
4. **Wait 48 hours**, as Google suggests, before adding DMARC.
5. **Publish DMARC at `p=none`** with a `rua` address on a group or dedicated mailbox; XML reports arrive daily from every large receiver.
6. **Read the reports for a few weeks**, through a DMARC reporting service, and fix any legitimate sender that fails.
7. **Move to `p=quarantine`, then `p=reject`**, once the reports show your real email passing.
::::

Google ends SPF with `~all` (soft fail), Microsoft with `-all` (hard fail). With DMARC in place it matters less: DMARC decides what happens to a failure.

> [!WARNING] Don't stop at p=none
> `p=none` only reports; it protects nobody. Many domains publish it to satisfy a checklist and stay there for years.

## Why it matters

- **Delivery.** Gmail and Yahoo (since February 2024) and Outlook.com (since 5 May 2025) require at least `p=none` from anyone sending about 5,000 emails a day to their users ([Google](https://support.google.com/mail/answer/81126), [Yahoo](https://senders.yahooinc.com/best-practices/), [Microsoft](https://substrate.office.com/ip-domain-management-snds/Postmaster/Policies)). See [[Why are our emails going to spam?]].
- **Fraud.** At `p=reject`, nobody can send email showing your exact domain to a receiver that checks DMARC, so your customers stop receiving fake invoices from "you".

## What DMARC doesn't stop

- **Lookalike domains.** DMARC on `abc-trading.com.my` does nothing about `abc-tradlng.com`.
- **A hacked mailbox.** Its email passes every check. That is the most damaging form of [[Business email compromise in Malaysia: how invoice fraud works|business email compromise]]; the defence is login verification on every account.
- **Spoofing of your suppliers' domains.** You can publish DMARC only for your own.

## Check yours

Look up the TXT record at `_dmarc.` followed by your domain in any DNS lookup tool.

- **Nothing there:** you have no DMARC.
- **`p=none` for a year or more:** you have reports nobody reads.

Either takes an afternoon to fix, plus a few weeks of reading reports. If you want this done for you, see [[Emails going to spam]].
