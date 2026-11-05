---
title: "A write request must call the write tool in the same turn, never claim a card without one"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# A write request must call the write tool in the same turn, never claim a card without one

Prompt rule for agents with confirm-card writes: when a user asks for a write, call the write tool in that same turn. Never reply that a card was shown unless a tool call happened in that turn.
Why: in repeated runs on one thread, some turns said a card was shown with no tool call behind it.
Measure with repeated real chat turns on one thread. A single passing turn does not show this.

Evidence: "2/12 không gọi tool mà vẫn báo có card"
