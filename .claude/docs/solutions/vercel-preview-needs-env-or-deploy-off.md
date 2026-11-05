---
title: "Branch deploys need env vars for their environment, or they are turned off"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Branch deploys need env vars for their environment, or they are turned off

Before relying on a Vercel Preview build, confirm its env vars exist for the Preview environment.
Vars set only for Production make every Preview build fail at build time.
Reason: module-level env validation (src/db/client.ts) throws when a var is missing, so the build fails at "Collecting page data".
Fix one of two ways:
- Add the vars to Preview, pointing at a non-production DB.
- Limit deploys in vercel.json: "git": { "deploymentEnabled": { "**": false, "main": true } }.
Trade-off: with branch deploys off, PRs get no preview link.
After a change, check the first merge to main actually produces a Ready production deploy.
A PR with zero checks is not evidence that CI passed.

Evidence: "cả 18 biến trên Vercel chỉ đặt cho **Production**, Preview không có biến nào."
