---
title: "Under reduced motion, render a flat fallback and do not load the 3D library"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Under reduced motion, render a flat fallback and do not load the 3D library

A 3D scene behind a reduced-motion check must use a flat fallback and must not import the 3D library.
The fallback must still complete the full interaction, such as spin-to-result, so no user is blocked.
Check it by running the flow with reduced motion on and confirming a result appears.

Evidence: "Giảm chuyển động: dùng vòng phẳng, không tải `three`, vẫn quay ra kết quả."
