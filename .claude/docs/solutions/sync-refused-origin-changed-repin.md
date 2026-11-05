---
title: "When an app's sync refuses because origin changed, ask for a re-pin instead of bypassing it with git"
level: project
confidence: low
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# When an app's sync refuses because origin changed, ask for a re-pin instead of bypassing it with git

If the app's sync-with-base tool refuses because the origin URL no longer matches the pinned one, do not run raw `git merge` or `git fetch` to get around the check.
Ask the user to re-pin the origin in the app's troubleshooting menu, then retry the app's tool.
If the user chooses a raw git merge instead, that is their decision to make and should be recorded as such.

Evidence: "The repository's `origin` no longer points where it did when the app first saw this repository"
