---
title: "Speed to lead: why the first reply decides the deal"
description: Speed to lead is how fast you reply to a new enquiry. What the research shows, why replies are slow, and how a small B2B team can answer within the hour.
date: 2026-10-12
updated: 2026-10-15T01:20:18+00:00
author: jotham-lim
category: leads-and-measurement
related_pages:
  - problems/website-form-not-sending-emails
  - problems/building-a-website-that-brings-in-enquiries
---
Speed to lead is the time between a buyer's enquiry and your first human reply. Reply within the hour: in a study of 1.25 million leads, firms that did were nearly seven times as likely to reach a decision maker as firms that waited an hour longer. For a small B2B team, that is usually cheaper than buying more leads.

## What the research shows

The study is ["The Short Life of Online Sales Leads"](https://hbr.org/2011/03/the-short-life-of-online-sales-leads) by James B. Oldroyd, Kristina McElheran, and David Elkington (Harvard Business Review, March 2011). It has two parts.

First, the authors sent a test enquiry to 2,241 US companies and timed the replies:

| Response time | Share of companies |
|---|---|
| Within an hour | 37% |
| One to 24 hours | 16% |
| More than 24 hours | 24% |
| Never | 23% |

Of the companies that replied within 30 days, the average was 42 hours.

Second, they studied 1.25 million leads at 29 B2C and 13 B2B companies. Firms that tried to reach a lead within an hour were nearly seven times as likely to qualify it (a meaningful conversation with a key decision maker) as firms that tried an hour later, and more than 60 times as likely as firms that waited 24 hours or more.

> [!NOTE] Limits of the data
> This is American data from 2011, mixing consumer and business sales, from before WhatsApp became central to Malaysian business. Newer figures on vendor blogs ("21 times more likely in five minutes") don't trace to a study I could read, so I leave them out. The direction of the finding still holds.

## Why the first reply wins

A buyer who fills in your quotation form is usually comparing three or four suppliers that afternoon. The first to reply frames the conversation: which questions matter, what a fair price is, what "in stock" means. A fast, useless reply still loses to a slow, useful one, but a useful reply on Thursday to an enquiry sent on Monday often reaches a buyer who has already shortlisted someone else.

## Why replies are slow

The HBR authors found leads pulled from the CRM once a day, salespeople busy with their own prospecting, and lead-sharing rules built for fairness rather than speed. In Malaysia I also see:

- **The form emails `info@`, and nobody owns `info@`.**
- **The notification goes to spam**, because the domain has no proper SPF, DKIM, and DMARC. See [[Why are our emails going to spam?]].
- **The enquiry arrives on WhatsApp on one person's phone**, and that person is on leave. See [[How to connect WhatsApp enquiries to your CRM]].
- **The reply waits for a price** that needs someone else.
- **Enquiries arrive after hours**, when buyers do their research.

## Measure your own first

It takes an afternoon.

1. Send a test enquiry through every way in: the website form, each WhatsApp button, and the email address on the Contact page. Use a name your team won't recognise.
2. Repeat at different times: a Tuesday morning, a Friday at 5pm, and a Saturday.
3. Note when each human reply arrives. An automatic "We have received your enquiry" doesn't count.
4. Check the last month of real leads in the CRM, if it records creation time and first reply.

## A good first reply starts the conversation

Within the hour, a person sends:

- their name and a direct way to reach them;
- one line showing they read the enquiry ("You asked about the 10-tray oven for a central kitchen");
- the one or two questions they need answered to quote;
- the day the quote will come, not "soon".

That takes two minutes on a phone. The full quote can follow tomorrow.

<img class="wiki-logo-light" src="/media/diagrams/speed-to-lead-first-reply.svg" alt="A new enquiry from the form, WhatsApp, or email lands in one inbox; the person on duty sends a first reply within the hour, then hands it to a salesperson who sends the quote on the promised day." loading="lazy" decoding="async">
<img class="wiki-logo-dark" src="/media/diagrams/speed-to-lead-first-reply-dark.svg" alt="" loading="lazy" decoding="async">

## A routine for a team of three to ten

- **One person on leads per shift.** They reply to everything new within the hour, then hand it to the right salesperson.
- **One inbox.** Form notifications, WhatsApp, and the Contact page email all land where the person on duty looks: a CRM lead view, or a shared mailbox.
- **A first-reply template per product line**, so replies are fast and still specific.
- **An out-of-hours message with a time** ("by 10am tomorrow"), and keep it.
- **One number a week**: the median time to first human reply. Tag where each lead came from too, with [[UTM parameters: a naming convention your team will keep|a UTM naming convention]].

None of this needs new software.

## What I have seen

For [a Malaysian distributor of commercial kitchen equipment](/work/ultimate-circle), I built a catalogue of about 400 products that brings in quotation requests. The website makes the enquiry easy to send; it can't answer it. For the same client, I set up SPF, DKIM, and DMARC and spam protection for all staff, so the notification of a new request is delivered and can't be spoofed. Nobody can reply quickly to an email they never saw.
