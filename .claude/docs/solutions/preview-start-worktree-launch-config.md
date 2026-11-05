---
title: "In a git worktree, start the dev server through Bash, not preview_start"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# In a git worktree, start the dev server through Bash, not preview_start

Inside a git worktree, do not use preview_start with a name: it reads the main checkout's launch config and can attach to whatever is already on :3000.
Start the dev server through Bash in the background on its own port, with the env it needs, and point the browser at that port.
Stop the server before running build or other gates that also use the port.

Evidence: "`preview_start` with `name` uses the main checkout's `launch.json` and attaches to :3000 (not this app)"
