---
title: "A one-shot animation guard set on mount can be reset by dev Strict Mode's second run"
level: global
confidence: low
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# A one-shot animation guard set on mount can be reset by dev Strict Mode's second run

In dev, React runs mount effects twice (unverified from memory).
A flag set on the first run makes the second run skip the animation, so it never plays.
Keep the one-shot state in a ref or a stored start time, and check the animation under the dev server, not only the production build.

Evidence: "Break shot did not play in dev: Strict Mode double effect"
