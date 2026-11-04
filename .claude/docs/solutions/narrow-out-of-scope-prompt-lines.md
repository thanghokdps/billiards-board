---
title: "Keep out-of-scope prompt lines narrow so unknown names still reach tools"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Keep out-of-scope prompt lines narrow so unknown names still reach tools

A broad out-of-scope line in the agent prompt makes the model refuse valid requests, such as an unknown player name that should go to the tool.
Write the scope rule narrowly and state that unknown names still go to the tool.
Test with an unknown name after every prompt edit.

Evidence: "The OUT OF SCOPE line "other people" is what made the model refuse an unknown name."
