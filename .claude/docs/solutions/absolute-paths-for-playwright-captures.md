---
title: "Pass absolute paths to Playwright screenshots"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Pass absolute paths to Playwright screenshots

A relative screenshot path can resolve to a directory other than the one the next step reads.
Use the absolute worktree path, for example <worktree>/.playwright-mcp/<name>.png.
Confirm the file exists at that path before reading it.

Evidence: "Playwright `page.screenshot` relative path went elsewhere"
