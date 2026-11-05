---
title: "Find which side owns the thread id before explaining a stale-conversation bug"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Find which side owns the thread id before explaining a stale-conversation bug

Before explaining why a chat shows old state, trace where the thread id is derived.
Here the server derives the checkpoint thread from its own date, so the client's date and thread id do not decide it.
Changing the browser clock does not start a fresh checkpoint, so do not propose that as a fix or test.

Evidence: "patching browser Date does NOT give a fresh checkpoint"
