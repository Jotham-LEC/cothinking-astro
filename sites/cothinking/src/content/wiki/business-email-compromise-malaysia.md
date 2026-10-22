---
title: "Business email compromise in Malaysia: how invoice fraud works"
description: Business email compromise tricks your accounts team into paying a scammer. How it works, recent Malaysian cases, and the controls that stop it.
date: 2026-10-12
updated: 2026-10-15T08:30:50+00:00
author: jotham-lim
category: email-and-security
related_pages:
  - problems/emails-going-to-spam
---
Business email compromise (BEC) is fraud in which someone gets into, or imitates, the email of a supplier, customer, or director to have money paid into their own account. In Malaysia it usually arrives as an email from a regular supplier saying their bank details have changed. A phone call to the supplier stops it.

## How it works

1. **Access.** The scammer phishes a password to a mailbox at the supplier or at your company, or registers a lookalike domain.
2. **Watching.** They learn who pays whom, what invoices look like, and when payments fall due. Some add rules that forward mail to themselves or hide replies.
3. **The request.** When a real invoice is due, an email in the existing thread says the supplier has "changed banks".
4. **Payment.** Accounts pays the new account, and the money moves on through mule accounts.
5. **Discovery.** Later, the real supplier chases the unpaid invoice.

Each variation has a different defence:

| Variation | What happens | What stops it |
| --- | --- | --- |
| Compromised mailbox | The real account of a supplier or colleague is used | Login verification (2FA) on every account; a call-back before paying new bank details |
| Lookalike domain | `supplier-co.com` becomes `supp1ier-co.com` or a free webmail address | Staff who check the address; an "external sender" warning; a call-back |
| Spoofed domain | Email forged to show your exact domain | DMARC at `p=reject` on your domain |

## Malaysian cases

Each was described by the police to the press.

| When and where | Loss | What happened |
| --- | --- | --- |
| Johor Bahru, February 2021 | Over RM740,000 | A scammer posed as one of the company's suppliers ([The Star](https://www.thestar.com.my/news/nation/2021/02/19/company-loses-rm740k-to-email-scam-police-report-lodged)). |
| 2023 | RM28.3 million, stopped | A company paying an overseas LPG supplier was emailed instructions to pay a new account. Police, Bank Negara Malaysia, and the banks traced and stopped the transfer ([The Vibes](https://www.thevibes.com/articles/news/96088/bank-negara-cops-foil-business-email-scam-of-over-rm28-mil)). |
| Johor Bahru, February 2024 | RM464,400 | An accountant who had dealt with a palm oil supplier by email for years paid a second bank account on the "supplier's" request. Police said the business email had been compromised ([NST](https://www.nst.com.my/amp/news/crime-courts/2024/02/1016577/company-loses-rm464400-email-scam)). |
| Tangkak, March 2026 | Over RM700,000 | An accounts officer made two transfers after emails impersonating the company's steel supplier ([The Vibes](https://www.thevibes.com/articles/news/120852/company-loses-over-rm700000-in-fake-email-steel-supply-scam)). |

Where the reports name the offence, it is cheating under Section 420 of the Penal Code. There is no published Malaysian total for BEC losses from the police or Bank Negara. For scale, the FBI's Internet Crime Complaint Center recorded 24,768 BEC complaints and US$3,046,598,558 in reported losses in 2025 ([FBI IC3 2025 report](https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf)).

## The controls that work

The emails in these cases came in an existing thread, about a real invoice, so "be vigilant" isn't enough. In order of value for a business of up to 50 staff:

1. **Call back before changing bank details,** on a number from your own records or the original contract, never from the email.
2. **Two people for new payees.** One enters a new or changed bank account; another approves it. Ask your bank whether it can require a second approver.
3. **Login verification on every mailbox.** Microsoft says multifactor authentication "effectively safeguards against account compromise and is essential for accounts with admin privileges" ([Microsoft](https://learn.microsoft.com/en-us/defender-office-365/responding-to-a-compromised-email-account)).
4. **DMARC at `p=reject`** on your domain. See [[What is DMARC?]].
5. **Block automatic forwarding to outside addresses.** Google Workspace allows it by default; turn it off or limit it to internal addresses under Apps → Google Workspace → Gmail → End User Access ([Google](https://knowledge.workspace.google.com/admin/gmail/let-users-automatically-forward-their-own-gmail-emails)). Microsoft 365 controls it in the outbound spam policy.
6. **Business email, not free webmail,** so a scammer's similar Gmail address can't pass for yours. See [[Why are our emails going to spam?]].

You can also check a bank account on PDRM's [Semak Mule](https://semakmule.rmp.gov.my/). It lists only reported accounts, so a clean result proves little, but a match means stop.

> [!IMPORTANT] If you have already paid
> Call your bank, then the National Scam Response Centre on **997** (24 hours). The government asks victims to report within 24 hours so accounts can be frozen ([MyGOV](https://www.malaysia.gov.my/en/topics/nsrc-997-hotline)). Then lodge a police report.

## If a mailbox was compromised

Assume the attacker read everything. Microsoft's checklist works for Google accounts too ([Microsoft](https://learn.microsoft.com/en-us/defender-office-365/responding-to-a-compromised-email-account)):

- Disable the account or reset the password, and don't send the new password by email.
- Sign the user out of every session.
- Remove MFA methods and devices you don't recognise.
- Look for inbox rules, including hidden ones, that forward, redirect, or hide messages.
- Check the Sent and Deleted folders, and warn the customers and suppliers who may have received email from the account.

A mailbox of customer details may also be a personal data breach under the PDPA, with notification duties. See [[PDPA amendments: what sales and marketing teams must change]].

> [!TIP] Do this week
> Add one sentence to your payment procedure: "We never pay to new or changed bank details without phoning the supplier on a number we already hold." Then tell your accounts team and your suppliers.

If you want the email side secured for you, see [How I work](/how-i-work).
