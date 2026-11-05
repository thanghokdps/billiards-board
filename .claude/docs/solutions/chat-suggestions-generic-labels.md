---
title: "Chat suggestion chips must use generic labels, not names or figures from current data"
level: project
confidence: high
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Chat suggestion chips must use generic labels, not names or figures from current data

Chat suggestion chips that send on click must not contain concrete names, scores, dates or counts from live data.
Reason: a clicked chip is sent as-is, so stale or made-up specifics produce a proposal for a match that never happened.
Example: use "Ghi kèo mới" or "Ai đang dẫn đầu bảng Elo?", not "Thén thắng Dũ 15-11".
When a chip needs data, have the agent look it up on send, not hard-code it in the message files.

Evidence: "các suggestion chưa đủ tốt, vì thường thi data sugestion đó sẽ không đúng, nên update sao cho phù hợp và general nhất có thể"
