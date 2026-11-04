---
title: "Limit failed login attempts per client and return 429"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Limit failed login attempts per client and return 429

Every endpoint that checks a password or credential must count failed attempts per client.
Example: after 5 failures in 15 minutes per IP, return 429 until the window passes.
A login route without a failure limit is a review finding, not a shortcut.

Evidence: "The admin login had no limit on wrong passwords; it now returns 429 after 5 failures in 15 minutes per IP."
