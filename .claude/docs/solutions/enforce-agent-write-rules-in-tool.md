---
title: "Enforce agent write-safety rules in tool code, not only in the prompt"
level: global
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Enforce agent write-safety rules in tool code, not only in the prompt

Enforce a write-safety rule in the tool's code, not only in the prompt text.
A prompt rule such as "never save two records at once" does not hold: a bare "ok" still wrote both.
When the input is ambiguous (for example, a confirm with more than one open item), reject the call in the tool and return an error the model must act on.
Keep the prompt text as guidance; the code is the guard.

Evidence: "luật trong prompt không giữ được, nên tool giờ chặn cứng: chat xác nhận chỉ nhận đúng 1 thẻ."
