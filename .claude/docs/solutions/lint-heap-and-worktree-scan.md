---
title: "Run lint with a larger heap and ignore errors under .claude/worktrees"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Run lint with a larger heap and ignore errors under .claude/worktrees

Directive: run pnpm lint with NODE_OPTIONS=--max-old-space-size=8192.
Why: at the default heap it crashes with an out-of-memory error.
With the larger heap it also reports errors in .claude/worktrees/, which are not part of the current change; judge only errors in changed files.

Evidence: "`pnpm lint` OOM-crashes at default heap"
