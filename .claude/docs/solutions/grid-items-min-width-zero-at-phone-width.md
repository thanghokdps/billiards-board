---
title: "Set min-width:0 on the items of each new grid, or the grid overflows at phone width"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Set min-width:0 on the items of each new grid, or the grid overflows at phone width

A min-width:0 rule on direct children of one grid class does not cover items of another grid class.
Give the new grid's items min-width:0, or use minmax(0,1fr) columns.
Re-measure scrollWidth at 375px after the change.

Evidence: "the `.grid > * {min-width:0}` rule does not apply"
