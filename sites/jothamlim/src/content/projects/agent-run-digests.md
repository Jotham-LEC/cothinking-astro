---
title: Agent-run digests
date: 2026-09-21
updated: 2026-10-03T16:29:26+00:00
---

Two bots that run unattended on an always-on container. Neither has an LLM API key or a cron entry; a scheduled agent session wakes on the box, reads a skill file and follows it. The code is a deterministic collector on one side and a deterministic sender on the other, and the judgement in between is the agent's.

**Lead digest.** Gated industry reports produce download leads, most of them junk, so they never reached sales. The Laravel site enriches and scores each one and exposes candidates over an HMAC-signed API, and the agent applies a written rubric, keeps at most five, writes a one-line justification for each and posts a card to the sales group on Feishu. From the rubric:

> A blank enrichment field means "we did not find them", not "they are junior". Judge on what the visitor typed. Never put a network name on the card, because it reads to sales as the company.

**Chat digest.** The overseas signal sits inside fifty internal chat groups, most of them domestic or operational. The agent reads the window since the last report, keeps what matters to one department, and writes a plain-text brief in fixed line shapes, which a shell script renders and mails.

## Decisions

- **Sends fail closed.** A real send raises unless an allow flag is set, and only the box sets it. The flag is not in the template, so a laptop is read-only by default.
- **The ledger is in git**, and the box's copy is authoritative. After each send the agent commits `ledger: 3 lead(s) sent 2026-09-21` and pushes, because an unpushed ledger is the failure it exists to prevent.
- **One sender, one collector.** The chat CLI rotates its refresh token on use, so a second machine would silently invalidate the box's grant. The old laptop timer was disabled rather than kept as a fallback.
- **Confirmed silence.** An empty window still sends a "no activity" note.
- **Failure pings me.** If credentials are stale or the firewall blocks the box, the agent sends nothing and messages me on Feishu with the fix.

## Links

The repositories are private. The facts in the rubric come from the [[Single source of truth|single source of truth]].
