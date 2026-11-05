---
title: "An admin-only setting that changes only the admin's browser is a UI gate, not access control"
level: project
confidence: low
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# An admin-only setting that changes only the admin's browser is a UI gate, not access control

If an admin-only control writes nothing to the server, the gate only hides it.
State that in the report, and do not describe it as protecting the data.
Any control that writes to the server needs a server-side admin check on the route, per the security rules.

Evidence: "Treat chỉ có tác dụng khi admin bấm quay trên máy của admin, đúng lựa chọn của bạn."
