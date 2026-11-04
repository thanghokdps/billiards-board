---
title: "Add .next/ to .gitignore and .prettierignore before the first commit"
level: project
confidence: high
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Add .next/ to .gitignore and .prettierignore before the first commit

Check that .gitignore and .prettierignore both list the Next.js build output folder before staging.
Without them, format:check fails on generated files and the first commit picks up build artifacts.

Evidence: "`format:check` fails only on `.next/` build output, which means `.prettierignore` is missing that folder."
