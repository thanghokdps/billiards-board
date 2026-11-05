---
title: "Use recharts isAnimationActive 'auto' to honour reduced motion"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Use recharts isAnimationActive 'auto' to honour reduced motion

Set isAnimationActive to 'auto' on recharts series instead of writing your own reduced-motion check.
The library reads the user's preference itself.
Source: recharts/es6/cartesian/Bar.js:503 and es6/util/usePrefersReducedMotion.js (installed source, read this session).

Evidence: "`isAnimationActive: 'auto'` handles reduced motion"
