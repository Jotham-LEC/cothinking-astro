---
title: Single source of truth
date: 2026-09-02
updated: 2026-10-03T16:29:26+00:00
---

A Markdown wiki holding every fact the marketing department publishes from: what the company is, what the product does and cannot do, how the brand writes and looks, the compliance rules that gate publishing, the market context, and a glossary. There are six numbered sections, and each has a README that says what its files cover and where people trip.

It exists because the same facts had been restated in briefs, skill files and three other repositories, and every copy drifted. The rule is now to author here and delete the copy downstream, because a second copy is a future contradiction.

## Conventions

- **Provenance tags.** Every claim says where it came from, and `[inf]` means inferred, so an agent does not commit to that number in copy.
- **`INTERNAL-ONLY`.** A fact that must not go outward is tagged, and the safe public phrasing sits beside it.
- **MUST / MUST NOT / SHOULD.** The first two gate publishing, and the third is flagged for a human. Compliance is binary; an earlier design scored it as a percentage and was removed, because a percentage invites shipping at 94.
- **As-of dates.** A fact that can change without anyone editing the wiki carries the date it was true.
- **Self-contained.** Every link resolves inside the repo, and references to other repos are plain paths.
- **Guidance and gates are separate.** The voice guide is guidance and the rules file is a gate, and each README says which it is.

The other repos read from here and never copy back. When the workbench was stripped, its copy of the rules was deleted and every sibling was repointed, but the old log entries that cited it were left alone, because rewriting dated history falsifies the record.

## Links

The repository is private. It is read by the [[Command-and-control workbench|workbench]] and the [[Agent-run digests|digests]].
