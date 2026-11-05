---
title: "Reserve the scrollbar gutter when a scroll lock hides the scrollbar"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Reserve the scrollbar gutter when a scroll lock hides the scrollbar

When a scroll lock removes the page scrollbar, reserve its space with `scrollbar-gutter: stable` instead of a fixed offset.
Reason: the scrollbar disappears when the lock opens, so anything positioned against the viewport jumps by the scrollbar width.
Also remove any extra margin the scroll-lock library adds for the scrollbar, or the compensation is counted twice.
Measure the element's position before and after opening the overlay to confirm it no longer moves.

Evidence: "khi mở rack thì thanh cuộn biến mất, nên dock nhảy 7,5px"
