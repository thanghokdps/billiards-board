---
title: "When a destructive command is denied, hand it to the user instead of routing around it"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# When a destructive command is denied, hand it to the user instead of routing around it

A denied cleanup or delete command is the user's decision. Do not retry it through another wrapper, script, or chained form.
Report the exact command and ask the user to run it.
The permission denial is the signal to stop, not an obstacle to work around.

Evidence: "were denied by permission: do not work around; ask user to delete"
