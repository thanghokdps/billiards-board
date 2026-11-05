---
title: "After resizing a container, recheck constants derived from its size"
level: global
confidence: low
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# After resizing a container, recheck constants derived from its size

When you change a container's height or width, grep for values computed from it (scale factors, radii, sprite sizes).
They often keep the old ratio and render oversized after the container changes.
Adjust them in the same change, then check the scene visually.

Evidence: "Bóng trong `BreakShot` tính theo chiều cao bàn, nên bàn cao hơn thì bóng sẽ to quá khổ, tôi chỉnh luôn hệ số."
