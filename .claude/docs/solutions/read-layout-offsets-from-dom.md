---
title: "Read layout offsets from the DOM instead of hardcoding pixel values"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Read layout offsets from the DOM instead of hardcoding pixel values

Do not hardcode a pixel offset that depends on another element's size (a header height, a sprite size).
Measure it from the DOM at runtime so the value stays correct when the layout changes.
A fixed number like 96 silently breaks on the next layout change.

Evidence: "Code trước đây dùng số cứng 96, tôi đổi sang đọc đúng vị trí header và kích thước sprite."
