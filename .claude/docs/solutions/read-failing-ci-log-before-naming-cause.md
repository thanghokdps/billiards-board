---
title: "Read the failing CI log before naming a cause"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Read the failing CI log before naming a cause

Open the failing job's log and quote its error line before forming a hypothesis about a CI failure.
Reason: a guess from recent commits (author email) was wrong; the log showed missing environment variables.
Order: fetch the failed job log, quote the first error line, then decide the fix.
A hypothesis that the log does not mention should be dropped, not patched.

Evidence: "nghi vấn ban đầu của mình sai, log không liên quan gì đến email."
