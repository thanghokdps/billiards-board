---
title: "Retest a failing agent turn on a fresh thread before changing the prompt"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Retest a failing agent turn on a fresh thread before changing the prompt

Directive: when a multi-step agent turn fails on an old thread, retry the same request on a fresh thread before editing prompts or tools.
Why: stale history biased the model; the same request then ran correctly on a new thread.

Evidence: "Trên thread mới, "cancel both cards" đã chạy đúng"
