---
title: Command-and-control workbench
date: 2026-09-23
updated: 2026-10-03T16:29:26+00:00
---

A repository where I sit with an agent to think and to produce deliverables. It does two things: it reads the team's chat and documents, and it builds projects. A project is a dated folder that yields an HTML report for the website, a press or client kit as a PDF, or working notes. Nothing runs on a schedule, and nothing dispatches anywhere.

It grew into an orchestrator for ten services first, with 22 skills, 45 tools, 16 SDKs, a venv, a linter and a test suite, and the machinery stayed after the jobs left. A written spec stripped it back to the two jobs above and put the rest on an archive branch.

## Constraints

Every spec here carries a constraints table, and breaking a row needs a dated amendment that says why.

| # | Constraint |
|---|---|
| C1 | No Python project. Amended: a Nix flake provides seaborn and TeX Live for deliverables, and nothing in the repo imports it. |
| C2 | No dependencies. HTTP is `curl` and `jq`. |
| C3 | Two secrets. |
| C4 | One agent harness. Amended to admit seven read-only MCP servers for analytics, ads and scheduling. |
| C5 | Four skills. Amended to five, with the first use recorded. |
| C6 | A committed file never cites a gitignored path. |
| C7 | No cross-repo coupling. |
| C8 | No build step. |

## Document kits

The org-mode to LaTeX to PDF pipeline is the part I like most. There are two kits, each a single `.sty` that travels with the document so that an archived project still builds years later. The press kit is a letterhead and a Q&A, where a level-one headline becomes a numbered question and seven named blocks become callouts. The industry-report kit is a consulting-house PDF, where a numbered headline is a chapter that opens on its own page and exhibits never float.

Figures come from seaborn in the house palette, as vector PDF and PNG side by side, so Emacs previews them inline and the PDF stays sharp. XeLaTeX sets Inter and inline Chinese, and social cards go the same way, LaTeX to PDF to PNG. I built a Typst twin, compared the two on one sample, and chose LaTeX.

## Links

The repository is private. The facts it reads live in the [[Single source of truth|single source of truth]], and the [wedding command centre](/projects#personal) is the same pattern at home.
