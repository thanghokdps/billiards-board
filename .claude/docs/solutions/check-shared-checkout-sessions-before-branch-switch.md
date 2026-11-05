---
title: "Check other sessions on a shared checkout before switching branches"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Check other sessions on a shared checkout before switching branches

Before switching branches or moving HEAD in a checkout another session is using, check that session is idle or finished.
Commit from a temporary worktree so the shared checkout's HEAD stays put.
Reason: a branch switch changes files under the other session and can strand its uncommitted work.

Evidence: "đổi branch trên checkout dùng chung sẽ đổi branch dưới chân session đó"
