---
title: "Gitignore .playwright-mcp/ before committing browser checks"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Gitignore .playwright-mcp/ before committing browser checks

Playwright MCP writes screenshots and console logs into `.playwright-mcp/` at the repo root.
Add `.playwright-mcp/` to `.gitignore` before the first commit that runs browser checks, and exclude it from lint and format runs.
Do not commit those artifacts; if they already exist, delete them after review rather than staging them.

Evidence: "eslint (bỏ qua `.playwright-mcp`)"
