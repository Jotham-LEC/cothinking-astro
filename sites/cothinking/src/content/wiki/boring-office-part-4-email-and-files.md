---
title: "Setting up IT for a small company, Part 4: Email and files"
description: "How a small company should set up email and shared files: one suite, shared mailboxes and drives, file names that sort, access by department, and one source of truth."
date: 2026-10-18
updated: 2026-10-20T07:51:41+00:00
category: setting-up-it
series: The Boring Office
part: 4
---
## Email: one suite, set up properly

Choose Google Workspace or Microsoft 365, and use only that one. The choice matters less than the setup; both are compared in [[Google Workspace vs Microsoft 365 for Malaysian companies]].

Whichever you choose, authenticate the domain with SPF, DKIM and DMARC, so that your email reaches inboxes and nobody can send in your name. See [[What is DMARC?]] and [[Why are our emails going to spam?]].

Shared work needs shared addresses. Make `sales@`, `accounts@` and `enquiries@` groups or shared mailboxes, so that enquiries don't wait in one person's inbox and stay with the company when that person leaves.

Verify payment instructions by phone. Invoice fraud by email is common in Malaysia; see [[Business email compromise in Malaysia: how invoice fraud works]].

## Files: shared drives, one per department

Keep the company's files in the suite's shared storage: shared drives in Google Workspace, or SharePoint team sites in Microsoft 365. A file in a shared drive belongs to the company; a file in an employee's own drive belongs to that employee's account and leaves with it.

Create one shared drive for each department, for example:

- Management
- Finance
- Sales
- Operations
- Marketing

## Who can see what

Give each person access to the drives their work requires, and no more.

- **Finance:** the finance team and management only.
- **Management:** management only.
- **Every other drive:** the department that owns it, with other staff added as their work requires.

Review the members of each drive when someone joins, changes role, or leaves; see [[Setting up IT for a small company, Part 7: People joining and leaving|Part 7]].

## Naming files so that they sort

Start each file name with the date in the ISO 8601 format, `YYYY-MM-DD`, followed by a short description in lower case with hyphens instead of spaces:

```text
2026-10-18-quotation-tan-trading.pdf
2026-10-18-board-minutes.docx
2026-11-01-payroll-october.xlsx
```

Dates written this way sort correctly by name, are read the same way in every country, and avoid the confusion between `10/11` and `11/10`.

## One source of truth

Every document has one final copy, and it is in the shared drive. Drafts can start anywhere: a personal drive, an email, a chat.

Share links in place of attachments. An attachment creates a second copy that soon differs from the first, while a link always opens the current version. A file received on WhatsApp belongs in the shared drive the same day.

Each kind of record has one system. Customers belong in the CRM, invoices and payments in the accounting system, and passwords in the password manager ([[Setting up IT for a small company, Part 3: Password managers|Part 3]]). A spreadsheet that copies any of them becomes a second, conflicting source.

---

## See also

- [[Setting up IT for a small company, Part 1: The Boring Office]]
- [[Google Workspace vs Microsoft 365 for Malaysian companies]]
- [[How to connect WhatsApp enquiries to your CRM]]
