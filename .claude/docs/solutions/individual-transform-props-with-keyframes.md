---
title: "Put offsets in translate and rotate, not in the transform keyframes"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Put offsets in translate and rotate, not in the transform keyframes

When an element has a transform keyframe animation, set positioning or rotation in the individual translate and rotate properties on the same element.
The keyframes then animate transform without overwriting the static placement.
Reason: a transform declaration in the keyframes replaces any static transform on that element.

Evidence: "independent `translate`/`rotate` properties alongside `transform` keyframes"
