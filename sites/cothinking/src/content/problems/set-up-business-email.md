---
title: Set up proper business email
description: How to set up business email on your own domain with Google Workspace or Microsoft 365, and move your existing email across, yourself or with my help.
date: 2026-10-08
updated: 2026-10-20T08:00:00+00:00
order: 2
what_i_do: I set up Google Workspace or Microsoft 365 on your own domain, and move your existing email across.
seo:
  title: Business email on your own domain for Malaysian companies
---
Proper business email gives everyone at your company an address on your own domain, run by Google Workspace or Microsoft 365, with the company holding the admin account. Many small businesses start on free webmail or on the mailboxes that came with their hosting, and move once those begin to cause trouble. Customers trust an address in the company's name more, and email sent from a hosting server is more likely to land in spam.

## How to check

Signs you have this problem:

- Staff send quotations from Gmail, Yahoo or Hotmail addresses.
- Your mailboxes came with the website hosting, and they fill up or stop working along with it.
- Nobody at the company can add or remove a mailbox without the old vendor.
- When someone leaves, their email leaves with them.

To confirm it:

1. Look up your domain's MX records. They show who runs your email: `google.com` means Google Workspace, `outlook.com` means Microsoft 365, and anything else is usually your hosting company.
2. Find out who holds the admin login for your email, and whether it is in the company's name.
3. Count the people who use a personal address for work.

> [!TIP] Free tools
> - [MxToolbox SuperTool](https://mxtoolbox.com/SuperTool.aspx): look up your MX records to see who runs your email.
> - [Google Admin Toolbox Check MX](https://toolbox.googleapps.com/apps/checkmx/): checks a domain's email records.
> - [Google Workspace pricing](https://workspace.google.com/intl/en_my/pricing.html) and [Microsoft 365 business plans](https://www.microsoft.com/en-my/microsoft-365/business/with-teams-plans-and-pricing): the current Malaysian prices of each suite.

## Possible causes

- The business started on free webmail and never moved. That works for one person, but free webmail can't be authenticated for your domain, and anyone can open a similar address.
- The email came with the hosting. Hosting mailboxes are small, and they share the server's reputation and its downtime.
- An old vendor set the email up on its own account, so the company can't manage it.

## If you or your IT person want to do it yourselves

### Before you start

You need:

- **A domain in your company's name**, and a login to its DNS. If an old vendor holds it, see [[Recover your domain from an old vendor]] first.
- **A choice of suite.** If your team edits Word and Excel files on the desktop, choose Microsoft 365 Business Standard. If it works in shared documents in a browser, choose Google Workspace Business Standard. [[Google Workspace vs Microsoft 365 for Malaysian companies]] compares the plans and their prices.
- **A list of everyone who needs a mailbox**, and of the shared addresses, such as `sales@` and `enquiries@`.
- **The logins to the current mailboxes**, so the old email can be copied across.
- **A company card** for the subscription, so it doesn't lapse when someone leaves.

> [!WARNING]
> Changing your MX records changes where new email arrives. Copy every existing DNS record first, and make the switch outside business hours, so that no email goes astray while the change takes effect.

### How to fix it

#### 1. Sign up in the company's name

1. Sign up for Google Workspace or Microsoft 365 with the company's name and an admin address the company controls.
2. Prove that you own the domain by adding the TXT record the setup gives you to your DNS.
3. Add a second admin, so the company is never locked out when one person leaves.

#### 2. Create the mailboxes

1. Create a user for each person, named the same way for everyone, such as `firstname@yourdomain.com`.
2. Set up `sales@` and `enquiries@` as groups in Google Workspace or shared mailboxes in Microsoft 365, so enquiries reach more than one person without a paid licence for each address.

#### 3. Copy the existing email across

1. Use the suite's own tool: the data migration service in the Google Admin console, or the migration page of the Exchange admin centre in Microsoft 365. Both copy mail from most older mailboxes.
2. Run the first copy before you switch, so most of the old email is already in place.

#### 4. Switch the MX records

1. A day before, lower the TTL of your MX records to five minutes, so the switch takes effect quickly.
2. Replace the old MX records with the ones the new suite gives you.
3. Run the copy once more to pick up email that arrived during the switch, and keep the old mailboxes for a few weeks in case anything was missed.

#### 5. Set up SPF, DKIM and DMARC

Add the records that prove your emails really come from you, so that they reach inboxes and nobody can send in your name. [[Emails going to spam]] has the steps.

#### 6. Lock it down

- Turn on two-step login for everyone, and enforce it.
- Keep the admin account in the company's name, with at least two admins.
- Agree what happens to a mailbox when someone leaves: it passes to a manager, and nobody deletes it.

## Questions

### Which should I choose, Google Workspace or Microsoft 365?

It depends mostly on how your team works with documents. Desktop Word and Excel point to Microsoft 365, and shared documents in a browser point to Google Workspace. If your current suite works well, staying usually costs less than moving.

### Can we keep our current email addresses?

Yes. The addresses belong to your domain, so they stay the same, and only the service behind them changes.

### Will we lose our old email?

Not if it is copied across before the switch. The migration tools bring the old mail over, and the old mailboxes can stay open for a few weeks afterwards.

---

## See also

- [[Google Workspace vs Microsoft 365 for Malaysian companies]]
- [[Emails going to spam]]
- [[What is DMARC?]]
- [[Recover your domain from an old vendor]]
- [[Website ownership checklist: who should hold your domain, hosting and analytics]]
