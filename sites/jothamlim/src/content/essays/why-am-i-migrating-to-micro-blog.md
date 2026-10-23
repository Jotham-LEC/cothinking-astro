---
title: Why Am I Migrating to Micro.Blog?
date: 2024-02-04
updated: 2026-10-03T16:29:26+00:00
image: ../../assets/media/essays/why-am-i-migrating-to-micro-blog/026ec42c-bbd7-44e1-9588-9f7d6dded037_1977x1112.webp
---

![](../../assets/media/essays/why-am-i-migrating-to-micro-blog/026ec42c-bbd7-44e1-9588-9f7d6dded037_1977x1112.webp)This is my 7th blog migration now—away from WordPress, [[Building a Personal Website — Why I Chose Obsidian Publish|Obsidian Publish]], [Super.so](https://super.so/), Ghost, Substack &amp; [[Why I Chose Hugo for My Personal Website|Hugo]].

Admittedly, it’s a form of procrastination. Spending more time messing around with websites means less time producing content.

But I don’t think it’s time wasted. I’ve learned a lot about web hosting and publishing with each content migration, and I believe that [Micro.blog](https://micro.blog/) is just one part of a long journey ahead.

Motive
------

1. **I love sharing, but I dislike social media**

- [Micro.blog](https://micro.blog/) is part of the [IndieWeb](https://indieweb.org/) &amp; [Fediverse](https://en.wikipedia.org/wiki/Fediverse) movement, where the key idea is to have content ownership in the hands of users.
- By committing to social media platforms, I’ll lock myself into walled gardens where content is difficult to migrate and control.
- Moreover, it creates bad incentives—such as paying for exposure, preying on people’s insecurities, and developing addictive time-sink features.

2. **Pure blogging isn’t right for me either.**

- The 6 blogging platforms mentioned above have one big challenge—*Reach*.
- Despite hosting content on my own domain, I find myself still sharing them on platforms like LinkedIn &amp; Facebook to get some semblance of visitor traction.
- Solutions like RSS feeds &amp; email subscriptions aim to help with that, but the “marketing” aspect of publishing can’t be ignored.
- Hence, I find myself maintaining several platforms instead of one, while facing the same aforementioned walled garden problems.

How I came across Micro.Blog
----------------------------

I first heard of webmentions while configuring the [Anubis Theme](https://github.com/Mitrichius/hugo-theme-anubis) for Hugo.

I tend to remove unwanted features from my themes to make my site more efficient. But learning about webmentions led me down a deep rabbit hole of [IndieAuth](https://indieauth.com/), [Micropub](https://indieweb.org/Micropub), [Brid.gy](https://brid.gy/), and a whole ecosystem of IndieWeb tools.

Getting my website “Indiefied” wasn’t difficult, and there are many resources out there that have helped. But I tried *hard* to make Micropub work on my site, but I can’t seem to get it right.

My site passed many of the [micropub.rocks](https://micropub.rocks/) tests, but I can’t connect it to iA writer for easy content publishing.

Not to mention, I dislike how fragile everything was. My site was held up by a ton of providers like GitHub, Cloudflare Pages, Netlify, [Webmention.io](https://webmention.io/), [Brid.gy](https://brid.gy/), IndieAuth…

Knowing how each of these services works with each other is amazing, but they represent points of failure that need to be tackled in the future. I foresee myself spending hours troubleshooting issues rather than learning new things.

---

[Micro.blog](https://micro.blog/) was brought up early on during my research into the IndieWeb. I’ve held off making a $5/month subscription because hosting my Hugo was free.

But a deck of cards is the only thing keeping my Hugo website afloat. The idea that Micro.Blog is also powered by Hugo, and it has all the IndieWeb configuration sorted (with a few minor tweaks), plus I don’t need to worry about hosting issues—I think it’s worth a shot.
