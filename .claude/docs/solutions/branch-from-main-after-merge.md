---
title: "Cut a new branch from origin/main once the previous branch's PR has merged"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Cut a new branch from origin/main once the previous branch's PR has merged

When the earlier PR is already merged, base the new branch on origin/main, not on that feature branch.
The merged commits are already in main, so stacking adds nothing and muddies the PR diff.

Evidence: "tôi cắt từ `origin/main` chứ không chồng lên PR #19, vì #19 và #20 (wheel) đều đã merge."
