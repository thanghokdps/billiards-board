---
title: "Recheck let declarations after a lint or format autofix"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Recheck let declarations after a lint or format autofix

Directive: after a format or lint --fix run, re-read variables declared with let before treating the edit as final.
Why: the autofix rewrote a let that was assigned later in the flow to const, which would break the logic.
Restore let and rerun typecheck.

Evidence: "Formatter changed `let cardsDecided` to `const`"
