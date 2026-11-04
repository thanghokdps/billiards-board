# Knowledge base

Start with the ADR: [`docs/adr/0002-agent-architecture.md`](../../docs/adr/0002-agent-architecture.md) (supersedes 0001). Feature slices: [`docs/features/an-bill.md`](../../docs/features/an-bill.md). Chat UI map: [`docs/design/ui-map.md`](../../docs/design/ui-map.md).

| Doc | Contents |
| --- | --- |
| [architecture.md](architecture.md) | Next.js layers, in-process AG-UI agent, user-writes confirm cards, one chat turn end to end |
| [conventions.md](conventions.md) | Feature folders, server/agent boundaries, rejected patterns (hydration traps included), pre-commit list |
| [stack.md](stack.md) | Exact pins, Node 20.19, db and dev commands, deploy |
| [entry-points.md](entry-points.md) | Pages, `/api/*` routes and their auth, scripts |
| [test-strategy.md](test-strategy.md) | No unit tests or evals; static gates, browser checks, live turns |

## Orientation

- **Where does a new chat capability go?** A tool in `src/langchain/tools/`, its name and result type in `src/lib/agent-results.ts`, listed in `prompts.ts` from `TOOL_NAMES`, rendered in `src/features/chat/renderers/tool-result.tsx`.
- **How does a tool know the caller?** `readTrustedContext(runtime.context)`. The CopilotKit route builds that context after checking the admin cookie.
- **Where do writes happen?** In `/api/admin/*` only. Chat tools return proposals, and the confirm card calls the route.
- **Where is chat history?** In Postgres (`PostgresSaver`), one thread per admin per day, pruned after 30 days.
- **How do I log in locally?** Go to `/vi/admin` with `ADMIN_PASSWORD` from `.env`.

## Constraints agents must respect

- pnpm only; Node 20.19 (`nvm use`).
- Never read, write or copy `.env`; new names go in `src/server/env.ts` and `.env.example`.
- Pin `@copilotkit/*`, `@ag-ui/*`, `@langchain/*`, `langchain` exactly and bump them together.
- No tool takes an identity field; no tool writes.
- `LANGSMITH_TRACING` never `"true"`; tracing goes through `TRACING_PROVIDER` (masked).
- No unit tests or evals unless the user asks.

## Open risks

- The login rate limit is in-memory per serverless instance (a marked shortcut).
- Highlight add and remove are not written to the audit log.
- Confirm-card state is in browser memory: after a reload, an already-saved card shows Save again. A repeat save is idempotent (same key), so it cannot create a duplicate.
