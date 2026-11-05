---
title: "Keep next-env.d.ts out of commits; next dev rewrites it"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Keep next-env.d.ts out of commits; next dev rewrites it

`next dev` modifies next-env.d.ts on its own.
Leave that file unstaged and out of every commit.
Stage by explicit path so it never slips in with `git add -A`.

Evidence: "`next-env.d.ts` trong worktree bị `next dev` tự sửa, tôi sẽ không đưa file này vào commit."
