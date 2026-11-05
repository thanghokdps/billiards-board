---
title: "Check git check-ignore before assuming a path is gitignored"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Check git check-ignore before assuming a path is gitignored

Before relying on a path being gitignored, run git check-ignore -v <path> and git status on it.
Do not trust a project doc that says a path is ignored; the repo's actual ignore state wins.
If a path is untracked and not ignored, never stage it with git add -A; stage specific files only.

Evidence: "`specs/` is untracked and not gitignored (never commit it)"
