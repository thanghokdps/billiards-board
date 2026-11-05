---
title: "Check the PR state before pushing a follow-up commit to its branch"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Check the PR state before pushing a follow-up commit to its branch

Before pushing a fix to a branch that has a PR, run `gh pr view <n> --json state` and confirm it is still OPEN.
A merged PR never picks up new commits, so the fix lands on a branch that main never sees.
If the PR is already merged, open a new branch from origin/main and cherry-pick the commit.

Evidence: "Lúc push tôi đã không kiểm tra PR còn mở hay không."
