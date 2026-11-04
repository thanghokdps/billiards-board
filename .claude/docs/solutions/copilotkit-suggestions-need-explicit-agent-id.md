---
title: "Pass consumerAgentId to useConfigureSuggestions outside CopilotChat"
level: project
confidence: med
ttl_days: 90
seen: 1
last_used: 2026-11-04
source: learn-capture
---

# Pass consumerAgentId to useConfigureSuggestions outside CopilotChat

When useConfigureSuggestions is called outside CopilotChat, it cannot infer the agent and falls back to "default".
Pass consumerAgentId explicitly so the suggestions attach to the assistant agent.

Evidence: "`useConfigureSuggestions` is called outside `CopilotChat`, so it falls back to agent "default"."
