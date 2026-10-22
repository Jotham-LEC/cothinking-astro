---
title: Website form not sending emails
description: Why a website's contact form stops sending enquiries without anyone noticing, how to find where they stop, and how to fix it yourself, or with my help.
date: 2026-10-07
updated: 2026-10-16T08:00:00+00:00
order: 1
what_i_do: I find where your enquiries go missing and make sure every one reaches you.
seo:
  title: "Website contact form not sending emails: how to fix it"
---
Your website's contact form has stopped sending you enquiries. A broken form looks fine: visitors fill it in, press Send, and the enquiry goes nowhere. The cause is usually how the website sends email, and it is usually quick to fix.

## How to check

Signs you have this problem:

- Website enquiries stopped, or dropped sharply.
- A customer says they filled in the form and never heard back.

To confirm it:

1. Fill in your own form, with a personal email address in it, and wait ten minutes.
2. Look in the inbox the form sends to, and in its spam folder.
3. If it arrived, open it and check who it is "from". An email from the visitor's address, sent by your web server, is the most common cause of a form that works only some of the time.
4. On WordPress, check whether your form plugin keeps a copy of each entry. If the entry is there but the email isn't, the form works and the sending is broken.

> [!TIP] Free tools
> - [WP Mail SMTP](https://wordpress.org/plugins/wp-mail-smtp/) (WordPress, free): sends a test email from the site and shows the error if it fails.
> - [mail-tester.com](https://mail-tester.com/): if you can change where the form sends, point it at the address this site gives you and get a spam score with the reasons.
> - [MxToolbox SuperTool](https://mxtoolbox.com/SuperTool.aspx): check your domain's SPF and DMARC records.

## Possible causes

- The site sends email from its own server, often "from" the visitor's address. Email providers don't trust that, so the messages are rejected or filed as spam.
- The host blocks sending. Many hosting and cloud servers block outgoing email entirely.
- Something changed. A new email password, a renamed mailbox or an expired connection stops the form without warning.
- An update broke it. On WordPress, a plugin update is a common cause.

## If you or your IT person want to do it yourselves

### Before you start

You need:

- **An admin login to the website**: WordPress admin, or the site builder's dashboard.
- **A login to your DNS**, to add the records that let the mail service send as your domain. See [[Emails going to spam]] for where to find it.
- **A mail service to send through**: your email provider's SMTP, or a transactional email service. Most have a free tier of a few hundred emails a day, more than a contact form needs.
- **A backup of the site**, taken before you install or change plugins.

### How to fix it

#### 1. Find where it stops

Follow one test enquiry:

1. **Does the form submit?** An error on the page, or a spinner that never stops, points to the form itself, often an expired spam check (reCAPTCHA keys).
2. **Does the site send it?** WP Mail SMTP's email test or the plugin's log shows whether the site handed it over.
3. **Does your email provider receive it?** Google Workspace's email log search and Microsoft 365's message trace show whether it arrived and where it was filed.

#### 2. Send through a proper mail service

1. On WordPress, install an SMTP plugin (WP Mail SMTP or FluentSMTP) and connect it to your mail service.
2. Set the **From** address to one on your domain, such as `website@yourdomain.com`, never the visitor's.
3. Set **Reply-To** to the visitor's email field, so replying still reaches them.
4. Send a test from the plugin, then a real one through the form.

<img class="wiki-logo-light" src="/media/diagrams/website-form-not-sending-emails-sender.svg" alt="A visitor fills in the form, the website saves a copy, and a mail service sends it from your domain with the visitor in Reply-To, so it reaches your inbox" loading="lazy" decoding="async">
<img class="wiki-logo-dark" src="/media/diagrams/website-form-not-sending-emails-sender-dark.svg" alt="" loading="lazy" decoding="async">

#### 3. Let the mail service send as your domain

Add the mail service's SPF `include:` and DKIM records to your DNS, as its setup page shows. Without them the form's emails can still land in spam. [[Emails going to spam]] has the steps.

#### 4. Keep a copy of every enquiry

Turn on entry storage in your form plugin (some need an add-on), so a failed email no longer loses the enquiry.

#### 5. Test it every month

Put a monthly reminder in your calendar to send yourself an enquiry. A broken form gives no warning, so a monthly test is the only way to know it still works.

## Questions

### How many enquiries have I lost?

Often nobody can tell, because a broken form leaves no trace. If the site also saves enquiries, you can count the ones that arrived there but not in your inbox.

### Can I fix a form on a site someone else built?

Usually, yes, if you have admin access to the site and to your domain's DNS settings.

---

## See also

- [[Speed to lead: why the first reply decides the deal]]
- [[Why are our emails going to spam?]]
- [[Emails going to spam]]
- [[Building a website that brings in enquiries]]
