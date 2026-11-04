---
title: "Run Playwright scripts under Node 20 via nvm"
level: project
confidence: high
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Run Playwright scripts under Node 20 via nvm

Run Playwright browser scripts with `nvm use` (Node 20.19) first.
Running them under a newer default Node fails to start, so the page checks look broken when the tooling is at fault.

Evidence: "Playwright needs Node 20, so run with nvm first."
