---
title: How to connect WhatsApp enquiries to your CRM
description: "How Malaysian B2B teams get WhatsApp enquiries into a CRM: the Business app or the API, tagged click-to-chat links, and what each costs in effort."
date: 2026-10-12
updated: 2026-10-15T01:20:18+00:00
---
To get WhatsApp enquiries into your CRM, you need to know where each chat came from and a way to record it that does not rely on memory. With the free WhatsApp Business app, that means tagged click-to-chat links and a daily logging habit. With the WhatsApp Business Platform (the API), a CRM or messaging tool creates the lead for you, and an ad click arrives with its source attached.

## Why WhatsApp enquiries go missing

Many Malaysian B2B buyers skip the contact form: they tap the green button and ask for a price on WhatsApp. The chat lands on whichever phone holds the number, often a salesperson's own. The CRM never sees it, so:

- marketing cannot say which page or campaign produced it;
- sales cannot see two colleagues quoting the same buyer;
- when the salesperson leaves, the conversation leaves too.

## The Business app or the API

| | WhatsApp Business app | WhatsApp Business Platform (API) |
|---|---|---|
| What it is | A phone app with business features | An interface a CRM or messaging tool connects to |
| Cost | No monthly fee | Per message for templates; replies inside the 24-hour window are free |
| Team use | One phone plus a few linked devices | As many agents as your tool allows |
| Gets leads into the CRM | By hand | Automatically, through the tool |
| Ad click data a CRM can read | No | Yes, for Click to WhatsApp ads |

- **Business app.** Has [labels, quick replies, greeting and away messages, a catalogue, and short links and QR codes](https://whatsappbusiness.com/products/business-app-features/). The number of linked devices has changed more than once; check WhatsApp's Help Center.
- **Business Platform.** What CRM integrations and shared-inbox tools use. Meta has [charged per message since 1 July 2025](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing): marketing templates always cost money; utility and authentication templates cost money outside the customer service window; ordinary replies are free. The window stays open for 24 hours after the customer's last message; outside it, you can send only an approved template. Meta publishes its rate cards in ringgit on the same page.
- **Both at once ("coexistence").** Some tools can [connect an existing Business app number to the API](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users/), so staff keep using the app while the CRM sees every message. Broadcast lists become read-only, disappearing and view-once messages are switched off in one-to-one chats, group chats do not sync, and only six months of history comes across. Ask the vendor whether its tool supports this before you buy.

## Tag every WhatsApp button

WhatsApp's [click-to-chat links](https://faq.whatsapp.com/5913398998672934) look like this:

```text
https://wa.me/60123456789?text=Hi%2C%20I%27d%20like%20a%20quote%20%5Bweb-pricing%5D
```

- The number is in full international format with no plus sign, leading zero, spaces, or dashes: 012-345 6789 becomes `60123456789`.
- The `text` parameter fills in the first message, URL-encoded.
- WhatsApp does not pass UTM parameters on, so end the message with a reference code in square brackets.

| Where the button is | Prefilled message ends with |
|---|---|
| Pricing page | `[web-pricing]` |
| Product page | `[web-product]` |
| Email newsletter | `[email-newsletter-oct]` |
| LinkedIn post | `[linkedin-post]` |
| Trade show banner (QR code) | `[event-qr]` |

Use the words of your `utm_source` and `utm_campaign` values, so the WhatsApp and web reports match; see [[UTM parameters: a naming convention your team will keep|a UTM naming convention]].

> [!NOTE] Two limits
> The customer can delete the prefilled text, so some chats arrive untagged. And a tap is not a message: Google Analytics 4 logs each tap on a `wa.me` link as an [outbound `click` event](https://support.google.com/analytics/answer/9216061) with its `link_url`, which shows which page sent people to WhatsApp, not who wrote.

## Three ways to get the chat into the CRM

<img class="wiki-logo-light" src="/media/diagrams/whatsapp-to-crm-routes.svg" alt="A tagged WhatsApp button leads to a chat; with the Business app someone labels it and logs it in the CRM daily; with the API, a messaging tool or your own integration creates the CRM lead automatically." loading="lazy" decoding="async">
<img class="wiki-logo-dark" src="/media/diagrams/whatsapp-to-crm-routes-dark.svg" alt="" loading="lazy" decoding="async">

1. **By hand, with the Business app.** Label each new chat ("New enquiry", "Quoted", "Won", "Lost"). At the end of each day, one named person creates a CRM record for every chat still labelled "New enquiry" and copies the reference code into the lead source field.
2. **A messaging tool on the API.** Most CRMs sold in Malaysia have a WhatsApp integration or work with a shared-inbox tool that does. A new chat creates or matches a contact, the conversation sits on the record, and leads are assigned by rule.
3. **Your own integration.** The API's webhooks deliver each incoming message to your system. A message from a Click to WhatsApp ad carries a [`referral` object](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview/) with the ad's ID (`source_id`), a link to the ad, and a click ID (`ctwa_clid`): better attribution than any prefilled code.

If you reply within 24 hours to a message from a Click to WhatsApp ad, a [free entry point window](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) opens for 72 hours, in which every message is free. Another reason to reply quickly; see [[Speed to lead: why the first reply decides the deal|speed to lead]].

## Where to start

For a team of 11 to 50 with one sales number:

1. Put the number on a SIM the company owns, in a phone that stays in the office.
2. Use the Business app with labels and daily logging for the first month. Count the chats.
3. Tag every WhatsApp button and QR code, and make lead source a required CRM field.
4. Move to a tool on the API when one person cannot log the day's chats properly, or when you run Click to WhatsApp ads.
5. Write down who can read the chats. They hold personal data, and the [[PDPA amendments: what sales and marketing teams must change|amended PDPA]] cares where it lives.

## What I have seen

For an image-fraud detection SDK company, I built the website and connected its forms to the CRM and analytics. The work that mattered was agreeing, before launch, what a lead is, which field records its source, and who sees it first. The same questions come first for WhatsApp: which number is the business's, who answers it, and where a chat is written down. Answer those and the app-or-API choice usually follows.
