# 0001 — Agent architecture: empty chatbot on CopilotKit + LangChain/LangGraph

- Status: accepted (skeleton)
- Date: 2026-11-03

## Shape

`Shape: A (LangChain createAgent on the LangGraph runtime) · host: Node, langgraph dev / langgraph up · transport: AG-UI via CopilotKit runtime v2 as an http.app route on the LangGraph server`

Named stack: "copilot-kit + langchainjs langgraph", no features yet. Plain LangGraph with no custom graph → shape A.

Reference: R10 (LangChain/LangGraph · Vite · one package). Its rows are `mastra-ai/ui-dojo` for the Vite side, `langchain-ai/memory-agent-js` for one package with `langgraph.json` at the root, and `CopilotKit/CopilotKit` `examples/v2/runtime/hono` for the handler. SHAs were not resolved: `gh` is not installed on this machine. The layout follows `layouts.md` L1, and the APIs were read from the installed packages.

## Card

| Row                               | Value                                                                                                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1 purpose                        | "A general chat assistant"                                                                                                                                                                            |
| Q1 host · Q2 clients · Q-L layout | Node on the LangGraph server (`langgraphjs dev`) · web · L1 single app                                                                                                                                |
| Q5 identity                       | dev user (`DEV_USER_ID`, refused when `NODE_ENV=production`) read through the trusted-context reader `readTrustedCaller` (`src/langchain/auth/identity.ts`)                                           |
| Q-D design                        | stock `CopilotChat` (v2) with theme tokens (`src/styles/tokens.css`)                                                                                                                                  |
| Q3 agent shape                    | one agent, id `assistant`, no tools; prompt in four sections OVERVIEW · RESPONSE · OUT OF SCOPE · CONTEXT (per run: date, caller), with a canary line for the leak eval                               |
| Q4 writes · P2–P4                 | deferred to `/agent-feature`                                                                                                                                                                          |
| Q6 memory                         | thread history in the LangGraph checkpointer — the in-memory one from `langgraphjs dev`, _dev only_                                                                                                   |
| Q7 models                         | primary `gpt-5.4-mini` (mid tier, general chat), fallback `gpt-5.4-nano`, cheap `gpt-5-nano`; ≈ $2.43 per user/month at 20 turns/day (3k in / 400 out tokens). _Revisit when the first feature lands_ |
| Q8 tracing                        | `TRACING_PROVIDER` = `none` (default) · `langsmith`; masking always on (inputs dropped, outputs reduced to token usage, metadata allowlisted, user id HMAC-hashed)                                    |
| Q-P PII                           | PII: trace masking on; input redaction on (email, credit card, IP; `url` kept)                                                                                                                        |
| Q9 evals                          | `evals/datasets/baseline.jsonl`, 12 seed cases, schema-validated (`evals/schemas/dataset.ts`)                                                                                                         |
| Q2v viewports · Q-T tests         | 375 px + desktop · `__tests__/` per group, cross-group tests in `src/langchain/__tests__/`                                                                                                            |

## Decisions

- **Runtime placement:** `createCopilotHonoHandler` from `@copilotkit/runtime/v2/hono` is exported as `app`, and `langgraph.json` registers it under `http.app`. There is no `hono`, `express` or `@hono/node-server` dependency and no server for the web app.
- **Agent adapter:** `LangGraphAgent` comes from `@ag-ui/langgraph`, constructed with `emitRawEvents: false`. `@copilotkit/runtime/langgraph` is avoided because it is `@deprecated Since 1.68.2`.
- **Client:** `CopilotKitProvider` and `CopilotChat` come from `@copilotkit/react-core/v2`. The v1 root export is avoided.
- **Identity (L0 + kit):** the route resolves the caller and builds a `LangGraphAgent` per request. Its `headerFactory` sends `x-api-key: INTERNAL_API_TOKEN` and the URI-encoded `x-caller-*` headers. `auth.ts` checks the secret with a timing-safe comparison, and the server stamps the caller on `configurable.langgraph_auth_user`. The graph reads only that value. Threads are owner-scoped, and a forged owner is overwritten. Studio auth is disabled (`disable_studio_auth`).
- **Route filter (L2):** `beforeRequestMiddleware` keeps only `forwardedProps.{streamSubgraphs, durability, command.resume}`. It cuts `messages` to the newest user message plus the tool results after it, and rebuilds the `Request` from its parts.
- **CONTEXT mechanism:** `dynamicSystemPromptMiddleware((state, runtime) => …)` reads `runtime.configurable.langgraph_auth_user`. A `contextSchema` is not used because `langgraph-api` 1.5.7 publishes no context schema for `createAgent` graphs.
- **PII fail-closed (L2):** stock `piiMiddleware` has no error option. The kit's `PIIFailClosedGuard` (`beforeModel`, `canJumpTo: ["end"]`) probes the detectors first. If any detector throws, it ends the turn with a fixed reply, and the model is never called.
- **Fallback (L0):** `modelFallbackMiddleware(MODEL_FALLBACK)`.
- **Graph UI:** `docs/graph.md` is drawn from code (`pnpm graph`), and a test fails when it drifts. LangGraph Studio is refused by custom auth (`disable_studio_auth`).
- **Node 20.19 + vitest 4.1.12:** vitest 5.1.0 needs Node ≥ 22.12, and the newest Node installed here is 22.11.0. Node 20.19.0 satisfies Vite 8 and langgraph-cli. Moving to vitest 5 means installing Node ≥ 22.12, which is a user choice.
- **TypeScript 5.9.3:** typescript-eslint 8.72.1 peers `typescript <6.1.0`.
- **Single copies:** pnpm `overrides` pin `@ag-ui/client`/`@ag-ui/core` 1.0.2 (CopilotKit 1.84.0 pins 1.0.2; two copies broke `AbstractAgent` assignability), plus `@langchain/core` 1.3.4, `@langchain/langgraph` 1.6.0 and `langchain` 1.6.1.
- **CopilotKit threads:** `identifyUser` scopes CopilotKit's own thread routes to the caller. Telemetry is off (`COPILOTKIT_TELEMETRY_DISABLED`).

## Deferred

- P2 tasks, P3 systems, P4 out-of-scope list: to `/agent-feature`.
- Q4 writes / HITL: to `/agent-feature` → `/agent-hitl`.
- Real authentication (replaces `resolveRouteCaller`'s dev user): a feature.
- Durable checkpointer (Postgres) before any non-dev deployment.

## Risks

- In-memory checkpointer: threads are lost on restart (dev only).
- The tracing masking is field-oriented. Free text inside allowlisted fields is not scanned.
