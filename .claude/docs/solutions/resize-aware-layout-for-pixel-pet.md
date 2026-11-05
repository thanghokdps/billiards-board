---
title: "Pixel pet reads window width only at mount and misses resizes"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Pixel pet reads window width only at mount and misses resizes

The pet's breakpoint and movement bounds are computed once at page load.
When the window is resized across the breakpoint, the pet keeps the old layout until reload.
Listen for resize and recompute the track, or document the reload requirement in the handoff.

Evidence: "Pet chỉ khởi động theo độ rộng lúc tải trang, nên kéo cửa sổ từ hẹp sang rộng phải tải lại mới thấy."
