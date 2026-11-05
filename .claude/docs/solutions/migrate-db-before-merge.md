---
title: "Run db:migrate on the target database before merging a schema change"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Run db:migrate on the target database before merging a schema change

Deploying main does not apply Drizzle migrations; the build does not migrate. Before merging a PR that adds a migration, run `pnpm db:migrate` against the target database (Supabase), or the new code will fail on the missing column.
Why: the deploy goes live on merge, so a code path reading a new column breaks the page immediately.
Check: after migrating, load one page that reads the new column.

Evidence: "repo không tự migrate lúc build. Bro phải chạy `pnpm db:migrate` trên Supabase trước khi merge"
