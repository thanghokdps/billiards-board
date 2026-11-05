---
title: "Write tool notices as instructions to the model, not to the user"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Write tool notices as instructions to the model, not to the user

Directive: a notice a tool returns to the model must say what the model should do next, worded for the model.
Why: a notice worded for the admin was relayed verbatim, asking the admin to resend a whole match.
Keep user-facing wording in fixed text the server emits, not in model output.

Evidence: "Guard notice was relayed to the admin"
