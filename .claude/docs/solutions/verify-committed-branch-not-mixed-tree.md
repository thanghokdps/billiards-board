---
title: "Run build and gates on the branch alone, not on a mixed working tree"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Run build and gates on the branch alone, not on a mixed working tree

A green build or typecheck on a working tree that holds another branch's uncommitted changes does not verify the branch you are about to push.
Run the gates again on a checkout or worktree that contains only the branch's committed state.

Evidence: "`pnpm build` chỉ chạy trên checkout chính lúc còn lẫn wheel, chưa chạy riêng cho branch này."
