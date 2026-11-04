---
title: "Split i18n message files by namespace for parallel work"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Split i18n message files by namespace for parallel work

Keep one message file per namespace rather than one shared messages file.
When several agents add pages in parallel, each one edits only its own namespace files, so their edits do not conflict.
Every namespace the request imports must exist, even if empty, or the build breaks.

Evidence: "Namespace-split message files allow parallel subagent work without merge conflicts."
