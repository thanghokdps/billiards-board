---
title: "Run full-repo lint with a larger Node heap, and check worktree paths in its output"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Run full-repo lint with a larger Node heap, and check worktree paths in its output

Run full-repo lint with NODE_OPTIONS=--max-old-space-size=8192, or it crashes.
The output also includes files under .claude/worktrees/, which are copies, not repo sources; check the file paths before fixing anything.
Truncated output hides errors, so read the full list before concluding.

Evidence: "Cần `NODE_OPTIONS=--max-old-space-size=8192`, nếu không sẽ crash."
