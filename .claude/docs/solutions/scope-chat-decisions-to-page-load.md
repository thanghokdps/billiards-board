---
title: "Scope persisted chat decisions to the page load that produced them"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Scope persisted chat decisions to the page load that produced them

Stamp each chat decision with the page load (pageId) that produced it, and ignore decisions from other loads.
Without this, a reload replays old confirm decisions: the card POSTs again and shows a wrong "Saved".
Test it with a reload: after reloading, a bare reply must not write anything.

Evidence: "quyết định chat cũ được phát lại, thẻ POST lần nữa và hiện "Saved" sai."
