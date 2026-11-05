---
title: "Browser-tool mobile emulation sends mouse events, not touch"
level: global
confidence: low
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Browser-tool mobile emulation sends mouse events, not touch

Mobile emulation in the browser tool dispatches mouse events, not real touch events.
Do not treat a drag, swipe or touch-action check made this way as proof that touch works.
State the touch behaviour as unverified and check it on a real device, or with a touch-capable driver.

Evidence: "Giả lập mobile của tôi gửi chuột chứ không gửi chạm thật"
