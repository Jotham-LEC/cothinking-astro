---
title: Recover your domain from an old vendor
description: How to get your domain, hosting, and email accounts back from a former web designer or IT vendor and into your company's name, step by step.
updated: 2026-10-16T08:00:00+00:00
order: 4
what_i_do: I help you get the domain and the website and email accounts back in your company's name, and I can write to the old vendor for you.
case_study:
  - work/ultimate-circle
case_study_line: I did this for a Puchong-based distributor.
seo:
  title: Recover your domain from an old web vendor in Malaysia
---
Your old web designer or IT vendor still holds your domain, hosting, or email, sometimes in their own name. Everything works until you need a change, want to move host, or they stop replying. This page shows how to get the accounts back into your company's name.

## How to check

Signs you have this problem:

- Nobody at the company knows the login for the domain or hosting.
- Renewal invoices go to a vendor you no longer use.
- Small changes wait on the vendor.

To confirm it:

1. Look up your domain's registration to see which registrar holds it and, sometimes, in whose name.
2. Look up its nameservers and mail (MX) records to see who runs your DNS and your email.
3. Search your company's email for renewal invoices from registrars and hosting companies.

> [!TIP] Free tools
> - [MYNIC WHOIS](https://mynic.my/whois) for `.my` domains, and [ICANN Lookup](https://lookup.icann.org/) for `.com` and others: who registered the domain and when it expires.
> - [MxToolbox SuperTool](https://mxtoolbox.com/SuperTool.aspx): your nameservers (who runs your DNS) and MX records (who runs your email).

## Possible causes

- It was quicker at the time. The vendor registered everything on its own account to get the site live.
- The person who knew has left. A former employee set it up with a personal email address.

## If you or your IT person want to do it yourselves

### Before you start

You need:

- **Proof the company owns the domain**: your SSM registration, and invoices showing the company paid for it.
- **An email address you control**, outside the domain if possible, for the new accounts' login and recovery.
- **The expiry date.** If it is near, renew first: a domain that lapses during the move can take email down with it.
- **Time**: an hour or two of your own, plus days or weeks waiting for the vendor. A domain transfer itself takes up to a week.

> [!WARNING]
> Copy every DNS record before anything moves. If the new provider starts with an empty zone, your email and website stop until the records are put back.

### How to fix it

#### 1. Make a map of what you have

List each service and who controls it:

| Service | Provider | Account in whose name | Do we have the login? |
| --- | --- | --- | --- |
| Domain | | | |
| DNS | | | |
| Website hosting | | | |
| Email | | | |
| Google Business Profile, Analytics, Search Console | | | |

#### 2. Ask the vendor in writing

Send one email that lists exactly what you need. For example:

> Please transfer the following to [company name] by [date]:
>
> 1. The domain `yourdomain.com.my`: the transfer (EPP) code, or a push to our own registrar account.
> 2. An export of all DNS records.
> 3. Admin access to the hosting, or a full backup of the website and its database.
> 4. Admin access to the email accounts.

In my experience, most vendors hand everything over once the request is in writing.

#### 3. Move the domain into your own account

1. Open an account with a registrar in the company's name.
2. Recreate every DNS record there, or keep the current DNS until the end.
3. Start the transfer with the code. For a `.my` domain your new registrar will tell you what MYNIC needs, often a letter on company letterhead and the SSM registration.

#### 4. Move the hosting and email, if you are changing them

1. A day before, lower the records' TTL to five minutes, so the switch takes effect quickly.
2. Copy the website and the mailboxes to the new host first, and test them there.
3. Then point the DNS records at the new host. Keep the old one for a week in case something was missed.

#### 5. Lock it down

- Turn on two-step login on every account.
- Set the recovery email and phone to ones the company controls.
- Turn on auto-renew, with a company card.
- Keep the logins in a password manager that a second person can open.

## Questions

### What if the vendor refuses?

A registrar can often help a company that proves it owns the domain. MYNIC's formal dispute process is for bad-faith registrations and usually needs a lawyer.

### Do I have to stop working with the vendor?

No. You can keep them and hold the accounts yourself.

---

## See also

- [[Website ownership checklist: who should hold your domain, hosting and analytics]]
- [[Google Workspace vs Microsoft 365 for Malaysian companies]]
