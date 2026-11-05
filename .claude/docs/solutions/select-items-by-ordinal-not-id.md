---
title: "Let the model pick items by a short ordinal shown in context, not by long ids from history"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Let the model pick items by a short ordinal shown in context, not by long ids from history

Give the model short ordinal handles (#1, #2) for the items it must pick, not the long ids it sees in earlier turns.
Models copy stale ids from history, so the write hits the wrong record.
Resolve the ordinal to the real id inside the tool, after validation.

Evidence: "thẻ giờ được chọn bằng số thứ tự (#1, #2) thay vì id dài."
