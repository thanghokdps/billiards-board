---
title: "Do not submit guessed credentials to exercise a login error state"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Do not submit guessed credentials to exercise a login error state

To test an error or shake state on the login form, do not submit wrong passwords against a running server.
Use a seeded fixture, a test-only flag, or ask the user for the test credential.
Why: wrong attempts count toward the failed-login rate limit, and guessing passwords is not a test the user asked for.

Evidence: "Đã chạy 2 lần mật khẩu sai trên server local để test rung → không ảnh hưởng dữ liệu"
