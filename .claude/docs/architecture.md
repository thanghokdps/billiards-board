# Architecture

**Ăn Bill**: a scoreboard for one group's lunchtime billiards. Viewers browse public pages. The single admin logs matches by chatting with an assistant that only proposes writes; the admin confirms each one on a card. Intent and decisions: [`docs/adr/0002-agent-architecture.md`](../../docs/adr/0002-agent-architecture.md) (supersedes 0001). Feature slices: [`docs/features/an-bill.md`](../../docs/features/an-bill.md).

## Layers

| Path | Responsibility |
| --- | --- |
| `src/app/[locale]/` | Pages only (next-intl `[locale]` root param: `vi`, `en`). Thin: they call `src/server/*` and render `src/features/*` |
| `src/app/api/` | Route handlers: `admin/*` (cookie-gated writes), `copilotkit/[[...path]]` (chat runtime), `media/[id]`, `poster/*` (public PNGs) |
| `src/proxy.ts` | next-intl locale proxy for every non-API path |
| `src/features/<feature>/` | UI per capability (home, history, leaderboard, player, money, fame, rivalry, wheel, predictions, wrapped, tv, audit, admin, chat, matches, shell); `index.ts` is the import surface |
| `src/components/ui/` | Shared primitives (button, card, sheet, match-row, player-avatar, ball, …) |
| `src/server/<aggregate>/` | `repository.ts` (all SQL via Drizzle), `schema.ts` (zod), `service.ts` where a route composes; `server/posters/` (Satori templates and fonts); `server/http.ts` (`route()`, `HttpError`, `requireAdmin`, `parseJson`); `server/env.ts` |
| `src/server/auth/` | `session.ts` (HMAC admin cookie `anbill_admin`, 30 days, `isAdminRequest`), `login-limit.ts` (5 failures per 15 min) |
| `src/db/` | Drizzle schema (players, sessions, matches, match_players, events, audit_log, media, highlights, predictions, prediction_votes) and the `pg` pool |
| `src/lib/` | Framework-free helpers shared by server, agent and UI: `domain.ts` (types, `GAME_LABEL`, formatting), `stats.ts`, `agent-results.ts` (tool names + result contract), `wheel.ts`, `names.ts` |
| `src/langchain/` | The agent: `agent.ts` (createAgent + middleware, compiled once), `prompts.ts`, `context.ts`, `context-snapshot.ts`, `tools/`, `recap.ts`, `config/models.ts`, `guardrails/pii.ts`, `observability/tracing.ts`, `server/agui-agent.ts` |
| `src/i18n/`, `messages/{vi,en}/` | next-intl routing, request config, one JSON per namespace |
| `src/styles/globals.css` | Tailwind 4 `@theme` tokens ("felt at night") and the scoped CopilotKit theme (`.chat-theme.dark [data-copilotkit]`) |
| `drizzle/`, `scripts/` | SQL migrations; `migrate.ts`, `seed.ts` |

## Key decisions (why)

- **In-process agent, no LangGraph server**: Vercel can't host `langgraphjs dev`. `LangChainGraphAgent extends AbstractAgent` runs the compiled graph inside the Next route and turns `streamEvents` v2 into AG-UI events (ADR 0002, rung L3).
- **User writes**: `propose_*` tools only validate the request and resolve names. The confirm card (`features/chat/renderers/proposal-card.tsx`) calls `/api/admin/matches*`, sending the `toolCallId` as the idempotency key; undo is available for 30 s.
- **Open cards**: tapping a card never reaches the agent, so each run sends the ids of undecided cards in `RunAgentInput.context`. `server/open-cards.ts` keeps only ids that are proposals in this thread's checkpoint and puts them in the run context and CONTEXT. A new proposal closes every card that was open when the turn began (`supersedes`). `resolve_card` passes a chat "ok" or "cancel" to the card, which still does the write. With several cards open the model picks by #number; a confirm takes exactly one card (the tool refuses more), a cancel any number. The decision echoes the page load's `pageId`, so a reload that replays it writes nothing. A turn that leaves a card open ends with a fixed reminder line from the emitter, not from the model.
- **Identity**: the admin cookie is checked in the CopilotKit route, which builds `{ adminId, locale, timeZone }` on the server. Tools read it with `readTrustedContext(runtime.context)`. The client's history is never trusted: only the newest user message is taken, and the rest comes from the Postgres checkpointer, one thread per admin per day.
- **Recursion limit 60**: every middleware hook is a graph node, so with PII on, one model → tools round takes about 10 super-steps.
- **Byte-stable prompt prefix**: dynamic data (date, roster, today's matches) goes only into CONTEXT, marked as data.

## A chat turn end to end

1. `CopilotChat` (admin only, `features/chat/components/admin-chat.tsx`) POSTs to `/api/copilotkit/agent/assistant/run`, carrying the cookie and the `x-anbill-locale` header.
2. The route answers 401 without a valid cookie. Otherwise its `agents` factory builds `LangChainGraphAgent` with the trusted context.
3. The agent runs `agent.graph.streamEvents` on thread `admin-<local date>`, through the PII guard and redaction, the tool-call limit (12), retry and error mapping, the model fallback, and the dynamic system prompt.
4. A tool call streams `TOOL_CALL_*`, then `TOOL_CALL_RESULT`; the reply streams `TEXT_MESSAGE_*`, then `RUN_FINISHED`.
5. The client's wildcard `useRenderTool` parses the result with `parseToolResult` and renders a card: proposal, ask chips, stats chart, head-to-head, wheel or poster.
6. Tapping Save, or confirming in chat, calls the admin route, which writes, audits and records events. Then `router.refresh()` runs and the "match moment" overlay plays.

## External dependencies

| Service | Used for | Config |
| --- | --- | --- |
| Postgres (Supabase in prod, docker `db` on :5433 locally) | all data and chat checkpoints | `DATABASE_URL` |
| OpenAI | chat (`MODEL_PRIMARY`, `MODEL_FALLBACK`), recap (`MODEL_CHEAP`) | `OPENAI_API_KEY` |
| LangSmith (optional) | masked tracing when `TRACING_PROVIDER=langsmith`; `LANGSMITH_TRACING` stays `"false"` | `LANGSMITH_*`, `TRACE_HASH_KEY` |
| Vercel | hosting (serverless functions, `maxDuration` 60 on chat and recap) | project env vars |

## Hotspots

Not yet committed; the files each change touches most: `src/langchain/prompts.ts`, `src/langchain/tools/*.ts`, `src/lib/agent-results.ts`, `src/features/chat/renderers/*`, `src/server/matches/service.ts`, `src/lib/stats.ts`.
