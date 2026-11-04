---
title: "useSyncExternalStore snapshots must return a stable reference"
level: global
confidence: high
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# useSyncExternalStore snapshots must return a stable reference

Return one shared constant (or a memoized object) from a getSnapshot function when nothing changed.
A fresh object on every call makes useSyncExternalStore see a change on each render, which causes an infinite render loop.
Example: a module-level `const IDLE = { phase: "idle" }` returned from getCardState.

Evidence: "The bug: `getCardState` returns a fresh `{ phase: "idle" }` object on every call, so `useSyncExternalStore` sees a change on every render and loops."
