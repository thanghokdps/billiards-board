---
title: "When edit-guard blocks a heredoc write, switch to the Write tool"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# When edit-guard blocks a heredoc write, switch to the Write tool

Do not retry a shell heredoc after the edit-guard hook blocks it, even when the target is a scratch directory.
Use the Write or Edit tool so the lint and format hooks run.
Reason: the hook blocks shell writes to tracked paths and to scratch paths it classifies as repo output, and Write/Edit avoid that check.

Evidence: "The edit-guard blocked a heredoc into the scratchpad `pw` dir. Used Write instead."
