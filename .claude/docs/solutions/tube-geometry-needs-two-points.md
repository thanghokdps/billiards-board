---
title: "Guard TubeGeometry paths to at least two points before building the mesh"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Guard TubeGeometry paths to at least two points before building the mesh

Before building a TubeGeometry (or any curve-based mesh) from a per-player series, check that the path has at least 2 points.
With 1 point the constructor throws, and the page silently falls back to the 2D chart, so the 3D view looks broken only on prod.
Skip or pad single-point series in the scene builder.
Check the fix in the browser with a player who has a one-day history.

Evidence: "vì `TubeGeometry` throw khi đường dưới 2 điểm"
