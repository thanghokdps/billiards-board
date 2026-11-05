---
title: "Open the port the dev server actually logged, not the preview tool's default"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Open the port the dev server actually logged, not the preview tool's default

Before opening a preview, read the port the dev server printed on startup and use that URL.
Why: the preview tool reported 3001 while the server was listening on 3000, so the wrong URL showed nothing.
If you start the server with an explicit --port flag, use that value in the preview URL.

Evidence: "Preview reports 3001 but server is on 3000"
