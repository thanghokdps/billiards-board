---
title: "Do not write refs or set state during render"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Do not write refs or set state during render

Assigning a ref during render, such as `ref.current = value`, can trip the react-hooks lint and breaks concurrent rendering.
Write the ref in an effect, or in the event handler that needs it.
When an effect only exists to trigger an action, turn the action into an event handler.

Evidence: "It sets `finalRef.current = onFinal` during render, which may trip the react-hooks lint."
