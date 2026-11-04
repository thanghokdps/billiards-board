# 0002 — Agent architecture: Ăn Bill on Next.js + in-process LangChain agent

- Status: accepted · supersedes [0001](0001-agent-architecture.md)
- Date: 2026-11-04
- Source of intent: requirement doc "Ăn Bill — Requirement & UI/UX" (claude.ai artifact HLWU6Fiz62y68BKeas5xuN, rev 62)

## Shape

`Shape: A (LangChain createAgent) · host: node — Next.js route handler on Vercel (serverless function) · transport: CopilotRuntime v2 + own AG-UI emitter (in-process AbstractAgent)`

Why the change from 0001: the requirement names Next.js App Router, Postgres (Supabase) + Drizzle, and a free deploy on Vercel Hobby + Supabase. Vercel cannot host `langgraphjs dev` / LangGraph Platform, so `@ag-ui/langgraph`'s `LangGraphAgent` (which needs a LangGraph server URL) is out. The skeleton had no features, so it is rebuilt (skeleton.md §7).

Rung: **L3** for the transport — `LangChainGraphAgent extends AbstractAgent` (`src/langchain/server/agui-agent.ts`) runs the compiled `createAgent` graph in-process and translates `streamEvents` v2 into AG-UI events. Reason: no installed adapter runs a local LangGraph graph (`@ag-ui/langgraph` 0.0.45 exports only HTTP agents; `@ag-ui/langchain` 0.0.4 binds a bare model with frontend tools only, no server tool loop). Parity candidate if one appears: an in-process `@ag-ui/langgraph` agent; parity check = the E2E checklist flows.

## Problem (from the requirement)

- **P1** Ghi lại mọi trận bida trưa (T2–T6) của hội 5 người (Thén, Dũ, Bổ, Hi, Lâm); nhập liệu 100% qua chatbot, UI để xem, khoe, cà khịa.
- **P2** Tasks: create_match, create_matches (batch), update_match, set_bill, delete_match, query_stats, head_to_head, spin_wheel, generate_poster, trash_talk.
- **P3** One system: the app's Postgres (players, sessions, matches, match_players, events, audit_log). Writes: matches (create/update/delete/bill), players (admin UI).
- **P4** Out of scope for the bot: anything not about this group's billiards; money tracking beyond statistics (bills are already paid).

## Card

| Row                               | Value                                                                                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 host · Q2 clients · Q-L layout | Vercel serverless (Node runtime) · web (mobile-first PWA-ish) · L1 single Next.js app                                                                                                                                                                                           |
| Q5 identity                       | admin password (`ADMIN_PASSWORD`) → HMAC-signed httpOnly cookie (30 days). Viewers anonymous, read-only. Chat route refuses non-admin (401). Trusted context = `contextSchema` `{ adminId, locale, timeZone }` passed at invoke (in-process, so `runtime.context` works)        |
| Q-D design                        | requirement's "Bàn nỉ xanh về đêm" concept (no Figma): palette #0B1410 / #1F6B4A / #F5C451 / #D7263D / #F3EEDC, ball colour per player, condensed scoreboard numerals                                                                                                           |
| Q3 agent shape                    | one agent `assistant`; prompt OVERVIEW · RESPONSE · OUT OF SCOPE · CONTEXT (today, roster with aliases, last matches)                                                                                                                                                           |
| Q4 writes                         | **user writes** (kit rule: "proposes a change the user applies"): agent tools are read-only `propose_*` tools returning a proposal; the confirm card (`useRenderTool`) calls the app's admin route as the admin; undo for 30 s. No LangGraph interrupt, no pending-action table |
| Q6 memory                         | thread per day per admin (`thread_id = admin:<yyyy-mm-dd>`), LangGraph `PostgresSaver` on the same DB; pruned after 30 days. Client messages trimmed to the newest user message                                                                                                 |
| Q7 models                         | primary `gpt-5.4-mini`, fallback `gpt-5.4-nano`, cheap `gpt-5-nano` (recap, trash talk). Budget ≈ 2 USD/month: 1 admin × ~10 turns/day × 22 days ≈ 220 turns × (3k in · 400 out) ≈ $0.89/month                                                                                  |
| Q8 tracing                        | `TRACING_PROVIDER` none (default) · langsmith, masking on                                                                                                                                                                                                                       |
| Q-P PII                           | input redaction kept on (email, card, IP); player names are not PII here                                                                                                                                                                                                        |
| Q9 evals                          | **deferred by the user** ("không làm unit test + evals"); requirement agrees (TODO later). Verification = E2E checklist (`e2e-checklist.md`) on the running app, both /vi and /en                                                                                               |
| Q2v viewports · Q-T tests         | 375 px + desktop (+ TV mode 1920) · no unit tests (user decision)                                                                                                                                                                                                               |
| i18n                              | next-intl, `/vi` (default) + `/en`, messages in `messages/{vi,en}.json`                                                                                                                                                                                                         |
| Data                              | Postgres + Drizzle (`src/server/db/schema.ts`), migrations in `drizzle/`; Supabase in prod, Docker Postgres locally                                                                                                                                                             |

## Decisions

- Writes go through `src/app/api/admin/*` route handlers guarded by the admin cookie — the same routes the admin UI uses — never from inside a tool. Every write records `audit_log` (who, when, before, after).
- Stats (streaks, Elo per game type, head-to-head, money, records, achievements) are computed in `src/server/stats/` by replaying matches in date order — 5 players, hundreds of matches/year, cheap; cached per request.
- Posters: `next/og` `ImageResponse` (Satori) with template + avatar + real numbers; no AI image (cost/latency), noted as an extension.
- Random wheel: weights client-side, result from `crypto.getRandomValues`, nothing stored.
- Deprecated imports avoided: v1 `useCopilotAction` / `renderAndWaitForResponse` named in the requirement → v2 `useRenderTool` / `useFrontendTool` from `@copilotkit/react-core/v2`.

## Built (2026-11-04)

- Agent `assistant` with 9 tools (`src/langchain/tools/`), the confirm cards and renderers (`src/features/chat/`), and the in-process AG-UI emitter. The thread id is `admin-YYYY-MM-DD` (hyphen, not colon), set server-side.
- Writes: idempotency key on create (`matches.client_key`), undo via delete/restore/patch-back.
- Posters: `src/server/posters/` + `/api/poster/{match,wanted,rivalry}` with Barlow OFL fonts (Vietnamese), so no AI image.
- Recap: `src/langchain/recap.ts` on the cheap model via `POST /api/admin/recap`. Trash talk is answered by the primary model from `trash_talk` facts, not the cheap one.
- Admin login is rate-limited (5 failures / 15 min per IP, in memory per instance).
- Messages are per namespace: `messages/<locale>/<ns>.json`. The schema is in `src/db/schema.ts`.

## Deferred / risks

- Evals and unit tests: deferred by the user. Risk: prompt or model changes regress silently; the E2E checklist is the only gate.
- Single admin password: no per-admin identity in the audit log beyond "admin". Risk accepted for a 5-person group.
- Vercel Hobby function limit: chat turns must finish within `maxDuration` (60 s set on the route).
