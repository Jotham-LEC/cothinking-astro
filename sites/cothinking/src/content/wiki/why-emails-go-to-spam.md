---
title: Why are our emails going to spam?
description: Most business email lands in spam because the domain can't prove it sent it. The usual causes, the Gmail, Yahoo and Outlook rules, and how to check.
date: 2026-10-12
updated: 2026-10-15T08:30:50+00:00
category: email-and-security
related_pages:
  - problems/emails-going-to-spam
  - problems/website-form-not-sending-emails
---
Most business email goes to spam because the receiving server can't confirm it came from you: SPF, DKIM, or DMARC is missing, broken, or doesn't cover a tool that sends in your name. Less often, the cause is a poor sending reputation or complaints. Gmail, Yahoo, and Outlook have tightened their rules since 2024, so setups that used to get through now fail.

## Check what the receiver sees first

1. Send an ordinary email from your work address to a personal Gmail account.
2. Open it in Gmail on a computer, open the three-dot menu, and choose **Show original**.
3. Read the **SPF**, **DKIM**, and **DMARC** lines at the top. Each should say `PASS`.

Repeat this for everything else that sends as your domain: the contact form, newsletter tool, CRM, and invoicing system. The fault is often in one of these. If you send in volume, Google's Postmaster Tools and Microsoft's SNDS show your reputation at Gmail and Outlook.com.

## The usual causes, most common first

1. **Authentication is missing or broken.**
   - No DMARC record, or one left at `p=none` for years with nobody reading the reports. See [[What is DMARC?]].
   - Two SPF records, which make SPF fail outright ([Microsoft](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-spf-configure)).
   - More than 10 DNS lookups in SPF. Each `include:` uses at least one.
   - DKIM never turned on. Google Workspace and Microsoft 365 both need you to switch it on.
2. **The website form sends "from" the visitor.** To Gmail, that is your web server claiming to be `someone@gmail.com`, which fails every check. Send from an address on your domain (such as `website@yourcompany.com.my`) through an authenticated mail service, with the visitor in **Reply-To**. See [[Website form not sending emails]].
3. **A tool sends as you without being set up.** A newsletter platform, CRM, or quotation tool sending from your address needs its DKIM records in your DNS and its `include:` in SPF. Each has a domain authentication page listing them.
4. **A shared server's reputation.** Cheap shared hosting puts you on an IP address with other customers, and you inherit their reputation. Google also requires valid forward and reverse DNS for the sending IP ([Google](https://support.google.com/mail/answer/81126)), which some small hosts never set up.
5. **Recipients mark you as spam.** Google and Yahoo ask senders to stay below a 0.3% spam rate; Google recommends below 0.1% ([Google](https://support.google.com/mail/answer/81126), [Yahoo](https://senders.yahooinc.com/best-practices/)). Bought or old lists push you over quickly.
6. **The recipient's filter.** Corporate Microsoft 365 tenants quarantine mail the user never sees. If one customer never receives your email, ask their IT team to check the quarantine.

## The bulk sender rules

Stricter rules apply to a domain that sends about 5,000 or more emails a day to personal accounts at one provider. A newsletter to a large list can cross it on the day it goes out.

| | Gmail | Yahoo | Outlook.com |
| --- | --- | --- | --- |
| In force since | February 2024 | February 2024 | 5 May 2025 |
| Threshold | Close to 5,000 a day to personal Gmail accounts | Bulk senders (no published number) | More than 5,000 a day to Outlook.com, Hotmail, and Live addresses |
| SPF and DKIM | Both | Both | Both |
| DMARC | At least `p=none`, aligned | At least `p=none`, aligned | At least `p=none`, aligned with SPF or DKIM |
| Unsubscribe | One-click, for marketing email | One-click, for marketing email; honoured within 2 days | An easy, visible way to opt out |
| Spam rate | Below 0.3% | Below 0.3% | No number stated |
| Source | [Google](https://support.google.com/mail/answer/81126) | [Yahoo](https://senders.yahooinc.com/best-practices/) | [Microsoft](https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730) |

- **Bulk status is permanent at Gmail,** even if your volume drops ([Google](https://support.google.com/mail/answer/14229414)).
- **Failing mail is rejected.** Google has been ramping up rejections since November 2025 ([Google](https://support.google.com/mail/answer/14229414)). Outlook.com rejects it with `550; 5.7.515 Access denied, sending domain [SendingDomain] does not meet the required authentication level` ([Microsoft](https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730)).

These rules change; check the providers' pages before relying on them.

> [!TIP]
> Send newsletters from a subdomain such as `news.yourcompany.com.my`, to keep their reputation apart from staff email. Microsoft recommends this for services you don't control directly ([Microsoft](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-spf-configure)).

## Free webmail can't be authenticated

You can't publish SPF, DKIM, or DMARC for `gmail.com`, so a company selling from Gmail or Yahoo addresses can't authenticate its brand, and any scammer can open a similar address. Move to business email on your own domain first: [[Google Workspace vs Microsoft 365 for Malaysian companies]] compares the two usual choices.

If you want this fixed for you, see [[Emails going to spam]].
