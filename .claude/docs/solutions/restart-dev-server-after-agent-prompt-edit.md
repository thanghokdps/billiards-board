---
title: "Restart the dev server after editing the agent prompt"
level: project
confidence: high
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Restart the dev server after editing the agent prompt

After changing the agent's system prompt or tool setup, restart `next dev` instead of relying on HMR.
The compiled agent is cached on globalThis, so HMR reloads the module but keeps the old agent, and the change looks like it had no effect.

Evidence: "The compiled agent is cached on `globalThis`, so HMR won't pick up the prompt change."
