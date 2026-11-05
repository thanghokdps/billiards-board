---
title: "Fetch origin before saying local main is the latest"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Fetch origin before saying local main is the latest

Before claiming local main is up to date, fetch origin and compare against origin/main.
A local main can lag far behind origin, so a claim based on the local branch alone is unverified.
Example: local main was 49 commits behind origin/main, and the claim only held after the merge was checked on the remote.

Evidence: "(trước đó máy chậm 49 commit)"
