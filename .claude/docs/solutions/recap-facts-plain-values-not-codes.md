---
title: "Give recap facts plain values and forbid echoing field names"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Give recap facts plain values and forbid echoing field names

Pass LLM recap facts as human-readable values, not internal codes or field names such as game types or keys.
Add an explicit rule telling the model not to echo field names.
Reason: otherwise the recap quotes raw identifiers to the viewer.

Evidence: "I'll change the facts to plain numbers and add one rule against echoing field names."
