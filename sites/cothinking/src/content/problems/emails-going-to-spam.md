---
title: Emails going to spam
description: Why your company's emails end up in customers' spam folders, how to check the cause, and how to fix it yourself, or with my help.
date: 2026-10-12
updated: 2026-10-16T08:00:00+00:00
order: 0
what_i_do: I add the settings that show Gmail and Outlook your emails are genuine, and check every system that sends email in your company's name.
case_study:
  - work/ultimate-circle
case_study_line: I did this for a Puchong-based distributor.
seo:
  title: "Business emails going to spam: causes and fixes"
---
Your emails are landing in customers' spam folders. The cause is rarely what you wrote. It is usually missing settings on your domain, the ones that prove to Gmail and Outlook that your emails really come from you. When they are missing or wrong, quotations and invoices go to spam.

## How to check

Signs you have this problem:

- A customer says your quotation never arrived.
- Customers find your emails in their spam folder.
- Replies have dropped off and you can't say why.

To confirm it:

1. Send an email from your work address to a Gmail address you can open.
2. In Gmail, open the email, choose **⋮** then **Show original**, and look for `PASS` next to SPF, DKIM, and DMARC. `FAIL`, `SOFTFAIL` or a missing line tells you which record to fix.
3. Note which emails go missing. All of them, only invoices, or only the website's each point to a different cause below.

> [!TIP] Free tools
> - [MxToolbox SuperTool](https://mxtoolbox.com/SuperTool.aspx): look up your domain's SPF and DMARC records, and check whether your mail server is on a blacklist.
> - [mail-tester.com](https://mail-tester.com/): send an email to the address it gives you and get a spam score with the reasons.
> - [Google Admin Toolbox Check MX](https://toolbox.googleapps.com/apps/checkmx/): checks a domain's email records, most useful on Google Workspace.
> - [Google Postmaster Tools](https://postmaster.google.com/): if you send a lot of email to Gmail users, shows how Gmail rates your domain.

## Possible causes

- The settings are missing or wrong. They are three records in your domain's DNS, called SPF, DKIM and DMARC. Since 2024 Gmail and Yahoo have required SPF or DKIM from every sender, and all three from anyone sending thousands of emails a day.
- The domain has two SPF records. A domain may have only one `v=spf1` record, and with two, both fail.
- Something else sends as you. Your website form, accounting software or CRM sends in your name from a server your SPF record doesn't list.
- The server has a poor reputation. Cheap hosting can put you on a server shared with spammers, and when it is blacklisted, so are you.

## If you or your IT person want to do it yourselves

### Before you start

You need:

- **A login to your DNS.** This is wherever your domain's nameservers point: your registrar, your hosting, or a service like Cloudflare. MxToolbox's DNS lookup shows the nameservers. If an old vendor holds it, see [[Recover your domain from an old vendor]] first.
- **An admin login to your email**: the Google Workspace Admin console or the Microsoft 365 admin centre, to turn on DKIM.
- **A list of everything that sends email in your name**: your mailboxes, the website, accounting or invoicing software, the CRM, the newsletter tool.
- **Time**: about an hour of work, then up to 48 hours for changes to reach everyone (often minutes).

> [!WARNING]
> A mistake in your email records can stop email altogether. Screenshot every existing record before you change anything, so you can put it back.

### How to fix it

#### 1. Set up SPF

1. In your DNS, find the TXT record that starts with `v=spf1`. If there are two, merge them into one.
2. Make sure it lists every service that sends for you. For Google Workspace alone it is `v=spf1 include:_spf.google.com ~all`; for Microsoft 365, `v=spf1 include:spf.protection.outlook.com -all`. Each other sender's help pages give the `include:` to add.
3. Check it with MxToolbox's SPF lookup. It should pass with fewer than 10 lookups.

#### 2. Turn on DKIM

- **Google Workspace:** in the Admin console, go to **Apps → Google Workspace → Gmail → Authenticate email**, generate a record, add it to your DNS as a TXT record, then choose **Start authentication**.
- **Microsoft 365:** in the Microsoft Defender portal, go to **Email & collaboration → Policies & rules → Threat policies → Email authentication settings → DKIM**, add the two CNAME records it shows, then enable signing.
- **Every other sender** (the website's mail service, the newsletter tool) has its own DKIM records in its settings. Add those too.

#### 3. Add DMARC

1. Add a TXT record named `_dmarc` with `v=DMARC1; p=none; rua=mailto:you@yourdomain.com`. This changes nothing yet; it asks Gmail and others to send you reports.
2. Wait two to four weeks and read the reports. They show every server sending as you and whether it passes.
3. When everything legitimate passes, change `p=none` to `p=quarantine`, and later to `p=reject`, which stops forgeries. [[What is DMARC?]] explains the steps.

#### 4. Test again

1. Repeat the **Show original** check in Gmail, and send one to an Outlook or Hotmail address too.
2. If everything shows `PASS` and emails still go to spam, run MxToolbox's blacklist check. If your server is listed, follow the list's removal steps, or ask your host to move you, or send through your email provider instead of the hosting server.

## Questions

### Will this stop every email going to spam?

It removes the usual cause. A customer's own filter can still move an email now and then, but your domain won't be the reason.

### Can someone send emails pretending to be my company?

Without DMARC, yes. Scammers use this to send your customers fake invoices. DMARC at `p=reject` stops it.

---

## See also

- [[Why are our emails going to spam?]]
- [[What is DMARC?]]
- [[Business email compromise in Malaysia: how invoice fraud works]]
- [[Website form not sending emails]]
- [[Google Workspace vs Microsoft 365 for Malaysian companies]]
