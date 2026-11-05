---
title: "Make update-tool schemas partial so a changed-fields-only call validates"
level: project
confidence: high
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Make update-tool schemas partial so a changed-fields-only call validates

A chat tool whose update schema requires every field fails when the model sends only the fields it changed. Make the update schema `.partial()` (or make each field optional) and keep identity and target ids required.
Why: a required-all schema returns a generic "system busy" style error to the admin, which looks like an outage rather than a bad argument.
Check: run one real chat turn that changes a single field and confirm the before/after card appears.

Evidence: "`propose_update` bắt buộc đủ mọi field, nên model chỉ gửi field đã đổi là tool ném lỗi."
