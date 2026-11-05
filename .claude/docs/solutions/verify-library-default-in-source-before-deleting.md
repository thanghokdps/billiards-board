---
title: "Verify a library default in its installed source before deleting code that relies on it"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# Verify a library default in its installed source before deleting code that relies on it

When a doc says a library handles something by default, such as reduced motion, check that default in node_modules source before removing your own workaround.
Cite the file and line in the change, and update the doc if it is wrong.
Why: a doc can describe a default that the installed version does not have, and removing the workaround then silently drops the behaviour.

Evidence: "Xác minh trong source rồi bỏ hook thừa ở `BillChart`, đồng thời cập nhật docs."
