---
title: "Drive your own headless Chrome when the Playwright MCP browser is locked"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Drive your own headless Chrome when the Playwright MCP browser is locked

If the Playwright MCP browser reports it is already in use, do not wait or retry it.
Run a script with playwright-core and channel 'chrome' against your own dev server port, and write screenshots to absolute paths.
Reason: another session holding the MCP browser blocks every MCP call until it releases.

Evidence: "Playwright MCP "Browser is already in use" (wheel session holds it)"
