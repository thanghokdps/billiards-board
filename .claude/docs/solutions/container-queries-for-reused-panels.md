---
title: "Use container queries, not viewport breakpoints, for components reused in narrow panels"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Use container queries, not viewport breakpoints, for components reused in narrow panels

If a component is also rendered inside a narrow panel (such as a chat card), size it with a container query (@container and @xl:), not viewport breakpoints (sm:, md:).
Viewport breakpoints measure the window, so they pick the wrong layout inside a narrow panel.
Check the component at a narrow width such as 375px or 480px, not only on desktop.

Evidence: "Chat confirm cards reuse `MatchRow` in a narrow panel, so viewport `sm:` breakpoints would be wrong"
