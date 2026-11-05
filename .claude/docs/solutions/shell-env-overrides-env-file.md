---
title: "Shell environment variables override values loaded from --env-file"
level: global
confidence: high
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Shell environment variables override values loaded from --env-file

When a variable is set both in the shell and in an --env-file, the shell value wins.
Check with a one-line print before debugging a config value that seems ignored.
Why: a stale export in the shell silently masks the file you edited.

Evidence: "shell env vars beat `--env-file`"
