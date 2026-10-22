---
title: Saving a Vibe-Coded App
date: 2026-09-24T00:00:00Z
updated: 2026-09-24T00:00:00+00:00
type: text
---
> "I've inherited a vibe-coded app. How do I save it?"

You don't. You understand it. Those are different projects, and only one of them is available to you.

The problem with vibe coding isn't the code it produces. It's that it rewards acting before thinking, and the debt that creates isn't technical — it's comprehension. Nobody knows why anything is the way it is, including the person who shipped it.

I ran into this on a repo of mine that had grown to about ten services. The fix wasn't refactoring. It was reading it, writing down what each part was actually for, and deleting most of it.

1. Stop piling on top of the slop
2. Read the codebase — all of it
3. Map how things are actually piped together
4. Test that map against reality
5. *Then* make your first commit

It's slow, and slow feels like failure right now. But here's the test: if someone asks "how does this work?" and you can answer in two minutes, you're fine. If you have to go look — you don't have a codebase, you have a hostage situation.
