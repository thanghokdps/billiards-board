---
title: "Agent must call the write tool before claiming a change happened"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Agent must call the write tool before claiming a change happened

Directive: a reply that says a card or record changed must follow a tool call that made the change.
Why: the model copied an earlier reply from chat history and claimed a change with no tool call.
Fix: add a prompt rule, plus a per-turn reminder that is not checkpointed.

Evidence: "with no tool call (copying history)"
