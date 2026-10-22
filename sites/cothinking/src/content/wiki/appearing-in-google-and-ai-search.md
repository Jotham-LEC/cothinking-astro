---
title: Appearing in Google and AI search
description: How a small business gets found in Google and quoted in AI answers such as Google's AI Overviews and ChatGPT search, and what to check first.
date: 2026-10-12
updated: 2026-10-20T08:00:00+00:00
author: jotham-lim
category: search
related_pages:
  - problems/get-your-business-on-google
  - problems/building-a-website-that-brings-in-enquiries
---
AI answers now sit above or beside ordinary search results. Google's AI Overviews reached [more than 200 countries and territories and more than 40 languages](https://blog.google/products-and-platforms/products/search/ai-overview-expansion-may-2025-update/) by May 2025, Malay among them, and ChatGPT and Perplexity run search tools of their own. Each reads web pages, writes an answer and usually links to a few sources. The work that puts a business in Google's ordinary results is also what gets it quoted in these answers. Some people call it GEO, for generative engine optimisation.

## What Google says

Google's page on [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) says: "There are no additional requirements to appear in AI Overviews or AI Mode, nor other special optimizations necessary." A page has to be indexed and eligible to appear in Google Search with a snippet. Google adds that no new machine-readable files and no special structured data are needed.

> [!CAUTION]
> Anyone selling you an "AI file" for Google is selling something Google says you don't need.

## Let the search tools read your site

Each tool reads pages with its own crawler: Googlebot for Google, [OAI-SearchBot](https://developers.openai.com/api/docs/bots) for ChatGPT search and [PerplexityBot](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) for Perplexity. A site that blocks them can't appear in their answers, and when it happens it is usually by accident. Ask whoever runs your website to check the site's `robots.txt` file and its firewall settings against those three names.

Some crawlers, such as OpenAI's GPTBot, collect text to train AI models, and they are separate from the search crawlers. A business can refuse training and still be found. Whether to refuse it is a business decision.

## Answer one question per page

AI search splits a buyer's question into smaller ones and looks for pages that answer each of them clearly. A page titled with the question a buyer would type, such as "What is DMARC?", and answered in its first two or three sentences, is easier to quote than a page called "Email Security Solutions". Dates, figures and links to sources make a page easier to trust, as do the author's name and the date it was last revised. Pages on related questions should link to each other, which Google lists among its best practices.

This Wiki is written that way: [[What is DMARC?]] answers one question, and [[Why are our emails going to spam?]] answers the next.

Structured data, the labels in a page's code that tell search engines what the page is, helps when it matches what the page shows. Google's best practices ask for exactly that, so it should never describe anything the page doesn't.

## How to tell whether it is working

It can be measured only roughly. Appearances in AI Overviews and AI Mode are counted in Search Console's Performance report, mixed in with ordinary results. Visits from ChatGPT and Perplexity show in Google Analytics as referrals from their domains. Once a month, it is worth asking the three tools the questions your customers ask and noting whom they cite.

## What I have seen

As Head of Global Marketing at Moojing, a China-based market-intelligence company, I audited 530 of its web addresses for AI search, chose 32 priority pages and fixed their structured data and headings over five releases. I also built a wiki of 31 entries, which helped its organic search. None of it was exotic. Most of the work was careful upkeep of what the site already had.
