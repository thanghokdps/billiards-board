---
title: "Dim a stacked sibling with filter, not opacity"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Dim a stacked sibling with filter, not opacity

When dimming a card or plate that sits on top of other stacked content, use `filter` (e.g. `filter: brightness(...)`) instead of `opacity`.
Why: at reduced opacity the element is see-through, so the layer beneath shows through it and the stack looks broken.
Filter darkens the element's own pixels and stays opaque.

Evidence: "dùng `opacity` thì nhìn xuyên thấy tấm bên dưới"
