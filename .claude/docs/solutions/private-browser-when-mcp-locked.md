---
title: "When the shared Playwright MCP is held by another session, run a private headless Chromium"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# When the shared Playwright MCP is held by another session, run a private headless Chromium

If the shared Playwright MCP browser is locked by another session, do not wait on it or retry it.
Launch your own headless Chromium for this session on its own port, separate from the other session's browser.
Report that the screenshots are static and that hover or interaction checks were only tested through code.
Why: the lock blocks every browser call, and a separate headless instance keeps the check running without touching the other session.

Evidence: "Pane từ chối localhost nên tôi không thử lại. Tự chạy một Chromium headless riêng cho session này, tách khỏi browser của session wheel."
