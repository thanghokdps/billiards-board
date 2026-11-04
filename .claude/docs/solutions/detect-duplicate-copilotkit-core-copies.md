---
title: "Check for duplicate @copilotkit/core copies after install"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Check for duplicate @copilotkit/core copies after install

After installing or bumping CopilotKit, list the installed @copilotkit/core versions and confirm there is one copy.
Two copies built against different zod majors cause type and runtime mismatches, and the repo rule requires one copy.

Evidence: "two copies of `@copilotkit/core` (one built against zod 3, one against zod 4). The repo rule is one copy each."
