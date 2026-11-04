# Project Conventions

## Layer boundaries

- Pages (`src/app/[locale]/`) and features (`src/features/`) never import `src/langchain/*` or `@copilotkit/runtime`. The chat talks to the agent only through `/api/copilotkit`.
- The CopilotKit route (`src/app/api/copilotkit/[[...path]]/route.ts`) checks the admin cookie and builds the trusted context. It holds no agent logic.
- The agent (`src/langchain/`) reads the caller only via `readTrustedContext(runtime.context)`. Tools call `src/server/<aggregate>/` functions; no SQL inside a tool.
- `src/server/` never imports React, `features/` or `components/`; shared constants live in `src/lib/`.

## Forbidden patterns

- A tool that writes. Tools return proposals; the confirm card calls `/api/admin/*` with the `toolCallId` as the idempotency key.
- Identity from messages, tool args, `forwardedProps` or client headers. Client chat history is never trusted (only the newest user message is used).
- Any `@deprecated` symbol (lint `no-deprecated`), the `@copilotkit/react-core` root export (use `/v2`).
- Building the agent or the checkpointer per request; compile once in `agent.ts`.
- `LANGSMITH_TRACING="true"`; tracing goes through `TRACING_PROVIDER` (masked).
- Touching `.env` from the agent.

## Required patterns

- New env var → `src/server/env.ts` schema + `.env.example` (secrets empty, others filled, values with spaces quoted).
- Prompt: four sections in order; static text in `STATIC_SYSTEM_PROMPT`, tool names from `TOOL_NAMES`, dynamic data only in CONTEXT, marked as data.
- Every user-facing string in `messages/vi` and `messages/en`.
- Exact pins for `@copilotkit/*`, `@ag-ui/*`, `@langchain/*`, `langchain`; keep `pnpm.overrides`.

## Before every commit

- [ ] `pnpm format:check && pnpm typecheck && pnpm lint && pnpm build`
- [ ] Agent behaviour changed: one real turn per touched flow via `/agent-verify-turn` (no evals by user decision)
