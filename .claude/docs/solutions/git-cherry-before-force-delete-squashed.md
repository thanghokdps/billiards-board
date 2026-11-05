---
title: "Use git cherry to confirm a squash-merged branch before git branch -D"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Use git cherry to confirm a squash-merged branch before git branch -D

When git branch -d refuses a branch that was merged by squash, check with git cherry before force-deleting.
Run git cherry main <branch>: lines marked '-' mean the patch is already on main.
Force-delete only when every commit is confirmed; otherwise the branch holds work that is not on main.

Evidence: "cần `-D` vì Git không nhận là đã merge."
