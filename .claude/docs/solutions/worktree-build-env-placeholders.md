---
title: "In a git worktree, build with placeholder env vars instead of copying .env"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# In a git worktree, build with placeholder env vars instead of copying .env

A git worktree has no .env, so the build fails with `Invalid environment` at src/server/env.ts:59.
Fix it by passing placeholder values as shell env vars for the build command.
Never read, write or copy .env to make the build pass; CLAUDE.md forbids touching it.

Evidence: "worktree không có `.env`, nên báo `Invalid environment` ở `src/server/env.ts:59`"
