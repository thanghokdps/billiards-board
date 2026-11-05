---
title: "A decided action card must keep its outcome after a reload"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# A decided action card must keep its outcome after a reload

A card whose buttons call the admin API directly never writes to the agent's history.
After a reload, the card still shows its buttons, and the server still treats it as open.
Persist the decided state (client storage or the server) and render the outcome with no action buttons.

Evidence: "vẫn hiện nút, và server vẫn coi là đang mở, vì thao tác bấm đi thẳng tới"
