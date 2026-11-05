---
title: "Render interactive controls disabled until the client has hydrated"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Render interactive controls disabled until the client has hydrated

Render buttons that drive client logic as disabled until hydration finishes, so a tap before the React root attaches never looks live.
Why: a tap that lands before the root exists is silently lost, and the user sees a button that appears to work but does nothing.
Use a hydration flag (useSyncExternalStore with a server snapshot of false), and gate the control on it.

Evidence: "Fix: controls render disabled until hydrated"
