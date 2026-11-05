---
title: "Enforce which card a bare confirmation applies to in the tool, not the prompt"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Enforce which card a bare confirmation applies to in the tool, not the prompt

A prompt rule that limits a bare confirmation does not hold on its own.
A bare "ok" saved both open cards even though the prompt forbade it.
In the tool: refuse an ambiguous confirm when several cards are open and no card number is given, and allow one confirm per turn.

Evidence: "Bare "ok" saved both cards despite prompt: enforced in tool."
