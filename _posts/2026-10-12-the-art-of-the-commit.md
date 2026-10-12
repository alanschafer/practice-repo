---
title: "The Art of the Commit"
date: 2026-10-12 12:00:00 -0500
lede: "Small, honest snapshots make a history worth reading."
tags: [git, craft]
---

A commit is a tiny letter to your future self. The best ones are small, focused, and say *why* something changed, not just what.

## A good rhythm

1. Make one change.
2. Check it with `git status` and `git diff`.
3. Commit with a clear message.

```bash
git add index.md
git commit -m "Rewrite homepage intro"
git push
```

> If you can't describe a commit in one line, it's probably two commits.

Over time, these little notes become a map of how a project grew, one deliberate step at a time.
