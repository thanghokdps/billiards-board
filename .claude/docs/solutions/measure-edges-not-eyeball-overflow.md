---
title: "Measure element bounds numerically to check for overflow past an edge"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Measure element bounds numerically to check for overflow past an edge

To confirm an animated or positioned element stays inside the viewport, read its bounding box with getBoundingClientRect and compare it to the viewport size.
Eyeballing a screenshot misses 1–2px overflows that a number shows immediately.

Evidence: "Đo được bóng pet lố đáy màn hình 2px (885 so với 883)"
