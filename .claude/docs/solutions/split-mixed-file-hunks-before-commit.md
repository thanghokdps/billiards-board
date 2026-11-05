---
title: "Commit only your own hunks from a file another session also changed"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Commit only your own hunks from a file another session also changed

When one file holds hunks from two sessions, select only your hunks (filter the diff or use git add -p) and keep the rest uncommitted.
Before committing, scan the staged diff for foreign lines.
Reason: a whole-file add pulls in the other session's work and mixes two branches' changes.

Evidence: "`globals.css` chỉ lấy 3 trong 5 hunk"
