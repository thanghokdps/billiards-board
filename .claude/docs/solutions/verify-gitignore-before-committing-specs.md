---
title: "Check git check-ignore before assuming specs/ is ignored"
level: project
confidence: low
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Check git check-ignore before assuming specs/ is ignored

The global notes say specs/ is gitignored, but this repo does not ignore it. Before staging or skipping spec files, run `git check-ignore -v specs/` to see the real state.
Why: assuming the global rule would either commit planning files by accident or silently leave them out of the PR.

Evidence: "`specs/` ở repo này không nằm trong gitignore, nên tui sẽ không commit thư mục đó."
