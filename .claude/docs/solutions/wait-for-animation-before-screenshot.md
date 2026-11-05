---
title: "Wait for an entrance animation to finish before taking a screenshot"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Wait for an entrance animation to finish before taking a screenshot

Before judging brightness or colour in a Playwright screenshot, wait until CSS animations have ended.
Why: a capture mid-animation shows a dim or washed-out state even when the computed style is correct.
Check the computed filter or opacity after the animation; if it is at its final value, the screenshot is the problem, not the UI.

Evidence: "captured mid lamp-on animation"
