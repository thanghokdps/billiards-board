---
title: "Resolve model-supplied ids against server state when only one target exists"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Resolve model-supplied ids against server state when only one target exists

Directive: when the server holds exactly one valid target, act on it and ignore a model-supplied id that does not match.
Why: the model passed a stale cardId copied from an earlier card, which broke the decision.
Apply to any tool whose id argument the model may copy from history.

Evidence: "Model passed a stale `cardId`"
