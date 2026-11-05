---
title: "Playwright artifacts inside the repo break lint; keep them out or ignore them"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Playwright artifacts inside the repo break lint; keep them out or ignore them

Browser-tool scripts, screenshots and logs written inside the repo are linted and format-checked, so unrelated files fail the gates.
Write capture scratch outside the repo, or add the folder to the ignore config before running gates.
Until then, run eslint with --ignore-pattern '.playwright-mcp/**' and say so in the report.

Evidence: "Full `pnpm lint` fails only on `.playwright-mcp/walk.js` no-undef"
