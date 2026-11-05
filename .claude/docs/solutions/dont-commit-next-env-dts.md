---
title: "Never commit next-env.d.ts after a dev run"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Never commit next-env.d.ts after a dev run

Leave next-env.d.ts out of commits: the dev server rewrites it on every run.
Stage files by path so it never gets swept in.
Why: the change is generated noise that the next dev run undoes.

Evidence: "is modified by dev: do not commit"
