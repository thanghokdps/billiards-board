---
title: "Search origin/main when a feature is missing from the current branch"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Search origin/main when a feature is missing from the current branch

If a feature you expect is missing from the current branch, search origin/main before concluding it does not exist.
A feature can merge to main after your branch was cut, so a stale branch looks empty.
Fetch, then create the working branch from origin/main and read the code there.

Evidence: "Đang tìm trên `origin/main`, vì PR #16 mới merge có thể là nơi thêm nó."
