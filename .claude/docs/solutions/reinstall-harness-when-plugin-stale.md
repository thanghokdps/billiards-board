---
title: "Re-run the kit install script when the installed harness plugin lags the checkout"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Re-run the kit install script when the installed harness plugin lags the checkout

Before trusting the installed harness, compare the plugin's commit with the kit checkout's HEAD.
If they differ, run `bash scripts/install.sh` from the kit checkout, then start a new session so the updated plugin loads.
Why: a stale plugin runs old skills and rules, and a session that keeps running on it reports behaviour the current kit no longer has.

Evidence: "Chạy `bash scripts/install.sh` từ kit checkout rồi mở session mới."
