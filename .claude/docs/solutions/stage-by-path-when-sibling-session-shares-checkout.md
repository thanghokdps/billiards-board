---
title: "When another session has uncommitted edits in the same checkout, stage only your own files by path"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-05
source: learn-capture
---

# When another session has uncommitted edits in the same checkout, stage only your own files by path

Before committing, list which modified files belong to your feature and stage those paths only.
Other sessions working in the same checkout leave edits in shared files (for example globals.css or shared UI components) that are not yours.
Keep the file list in the shared notes folder so the committing session can pick the right files.

Evidence: "Một phiên khác đang sửa fame, money, rivalry, holo-frame cùng thư mục và cũng đụng `globals.css`, nên khi commit phải chọn đúng file của wheel."
