---
title: "Report tool argument errors as bad input, not as an infrastructure failure"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Report tool argument errors as bad input, not as an infrastructure failure

In the agent's tool error middleware, map argument validation errors to a reply that tells the model the input was wrong, and keep the 'service unavailable' reply for real infrastructure errors (DB, network).
Why: when a validation error reads as an outage, the model tells the admin the card is broken and stops, so the admin has nothing to fix.
Verify with an out-of-range value (for example a bill above the schema max) and check the reply names the input, not the database.

Evidence: "`toolRetryMiddleware` trong `src/langchain/agent.ts:39` biến lỗi thành message cho model, và model trả lời như sự cố hạ tầng."
