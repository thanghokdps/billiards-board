---
title: "Start your own dev server on a dedicated port when 3000 may be taken"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Start your own dev server on a dedicated port when 3000 may be taken

If an old dev server may still hold port 3000, do not use the browser preview tool, because it can attach to the wrong server. Start the dev server yourself from Bash on a separate port (e.g. 3123) and point the browser at that port.
Why: the preview attached to the stale server on 3000, so the test ran against old code.
Stop the server you started when verification is done.

Evidence: "Đang dựng dev server cổng riêng để kiểm tra thật; preview vừa rồi gắn nhầm vào cổng 3000 nên tui tắt nó đi."
