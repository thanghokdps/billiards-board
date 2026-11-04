---
name: task
description: Lightweight single-task workflow for small fixes and chores in this repo (no agent behaviour change).
---

# Task

For small fixes, chores, single-file changes. A change to what the agent does (tool, prompt, graph, auth) goes through `/agent-feature` or `/fix-bug` instead.

## Steps

1. TaskCreate: describe what needs to be done
2. Read `.claude/docs/conventions.md`
3. `nvm use` (Node 20.19), then implement the minimal change
4. Run: `pnpm format:check && pnpm typecheck && pnpm lint && pnpm build`
5. TaskUpdate: completed
6. Commit: `<type>: <description>`
