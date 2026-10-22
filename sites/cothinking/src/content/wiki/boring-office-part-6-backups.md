---
title: "Setting up IT for a small company, Part 6: Backups"
description: How a cloud-first small company should apply the 3-2-1 backup rule, what to back up outside Google Workspace or Microsoft 365, and how long Malaysian records must be kept.
date: 2026-10-18
updated: 2026-10-21T04:22:20+00:00
author: jotham-lim
category: setting-up-it
series: The Boring Office
part: 6
---
## The 3-2-1 rule

Keep:

- **3 copies** of the data: the working copy and two backups,
- on **2 different kinds** of storage,
- with **1 copy off-site**, away from the office and from the main provider.

## Syncing isn't a backup

Google Drive, OneDrive, and SharePoint keep files safe from a broken laptop, but they copy every change, including the harmful ones. A file deleted by mistake is deleted everywhere, and files encrypted by ransomware on one laptop are synced, encrypted, to the cloud. Each suite can recover deleted items only for a limited time:

| What was deleted | Google Workspace | Microsoft 365 |
|---|---|---|
| A file | 30 days in the trash, then 25 days through an administrator ([Google](https://knowledge.workspace.google.com/admin/drive/recover-deleted-files-and-folders-for-drive-users)) | 93 days in the recycle bin ([Microsoft](https://support.microsoft.com/en-us/onedrive/restore-your-onedrive-files)) |
| An email | 30 days in the trash, then 25 days through an administrator ([Google](https://knowledge.workspace.google.com/admin/support/troubleshooting/restore-a-users-permanently-deleted-email?hl=en)) | 14 days by default, at most 30 ([Microsoft](https://learn.microsoft.com/en-us/exchange/security-and-compliance/recoverable-items-folder/recoverable-items-folder)) |

A mistake noticed after that is permanent. Microsoft states in its shared responsibility model that the customer's data remains the customer's responsibility, even in a service it runs ([Microsoft](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility)).

## What to back up outside the suite

The suite's own recovery is enough for everyday files. Records you can't afford to lose need a copy outside it:

- **Accounting records:** ledgers, invoices, receipts, bank statements, and tax filings.
- **The company website:** its files, its database, and its domain and hosting details.
- **Sales documents:** contracts, quotations, and price lists.
- **Raw materials:** original photographs, design files, and other source files that can't be recreated.

Where these already live in the suite's shared drives, the suite holds the working copy, and the backups below hold the other two.

## Records must be kept for seven years

Malaysian law requires a company to keep its accounting records for seven years after the transactions they record (Companies Act 2016, section 245). Anyone who must file an income tax return must keep supporting documents for seven years from the end of the year of assessment (Income Tax Act 1967, section 82A). An accounting firm, which also holds its clients' records, has particular reason to keep a copy that can't be deleted by mistake.

## Where to keep the off-site copy

Use object storage from a provider other than your suite:

- **[Backblaze B2](https://www.backblaze.com/cloud-storage/pricing)** is my choice: from US$6.95 per terabyte a month, with Object Lock, which prevents a backup from being changed or deleted for a set period, even by an attacker with your password.
- **[Cloudflare R2](https://developers.cloudflare.com/r2/pricing/)** charges US$0.015 per gigabyte a month, with no fee for downloading the data back.
- **[Amazon S3](https://aws.amazon.com/s3/)** is the most widely supported.

The backup tool depends on what is being backed up, so I don't recommend one here. Whichever you use, it should run on a schedule without anyone remembering to start it, and report when it fails.

## Test a restore

A backup that has never been restored is an assumption. Restore a sample of each kind of data once, when the backups are first set up, to confirm that the copy is complete and that you know how to bring it back. After that, test again whenever the setup changes or a restore is in doubt.

---

## See also

- [[Setting up IT for a small company, Part 1: The Boring Office]]
- [[Setting up IT for a small company, Part 4: Email and files]]
