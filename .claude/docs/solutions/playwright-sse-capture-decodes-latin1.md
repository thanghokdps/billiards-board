---
title: "Playwright misdecodes event-stream bytes as Latin-1 in captures"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Playwright misdecodes event-stream bytes as Latin-1 in captures

When a text/event-stream response has no charset, Playwright decodes it as Latin-1, so captured Vietnamese text appears as mojibake.
Verify the wire bytes are valid UTF-8 before concluding the server is wrong; the browser decodes these streams correctly.

Evidence: "The mojibake comes from the capture: Playwright decodes a `text/event-stream` response with no charset as Latin-1."
