---
title: "Check /favicon.ico before chasing an unexplained 404"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Check /favicon.ico before chasing an unexplained 404

When a page sweep reports an unexplained 404, first check whether the request is the browser's automatic /favicon.ico fetch.
Add an app icon to remove it, rather than hunting for a missing route.

Evidence: "The mysterious 404 is just `/favicon.ico`."
