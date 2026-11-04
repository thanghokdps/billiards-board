---
title: "Use the machine's SSH host alias when github.com SSH is refused"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Use the machine's SSH host alias when github.com SSH is refused

If a direct SSH connection to github.com is refused, read the host aliases in ~/.ssh/config (host names only, never keys) and use the alias this machine already uses.
Do not switch to HTTPS by default.

Evidence: "SSH to `github.com` is refused."
