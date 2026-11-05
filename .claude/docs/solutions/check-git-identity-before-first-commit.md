---
title: "Set the repo's git user.email before the first commit on a multi-identity machine"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Set the repo's git user.email before the first commit on a multi-identity machine

On a machine with more than one GitHub identity, set the repo's user.email before the first commit.
Reason: a commit pushed under the wrong author stays that way unless shared history is rewritten.
Check with: git config user.email, then compare with the author of recent commits on the same remote.
If the repo has no local email, set it to the noreply address of the account that owns the remote.

Evidence: "Máy này chưa cấu hình email riêng cho repo."
