---
title: "Tool input fields the model may omit need .optional(), not only .nullable()"
level: project
confidence: high
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Tool input fields the model may omit need .optional(), not only .nullable()

In agent tool input schemas, a field the model may leave out must be `.optional()` (or the object must be `.partial()`), not just `.nullable()`.
Why: zod rejects a missing key before the tool runs, so one omitted field fails the whole write call and the admin gets no confirm card.
Example: `draftSchema` in src/langchain/tools/matches.ts had `threeWay: ....nullable()` with no `.optional()`.
Check every `.nullable()` field in tool schemas, not only the one that failed.

Evidence: "`draftSchema` ở `src/langchain/tools/matches.ts:33` khai `threeWay` là `.nullable()` nhưng không `.optional()`, nên zod ném lỗi trước khi tool chạy."
