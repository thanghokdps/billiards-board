# Feature: Ăn Bill — chat CRUD + viewer app (MVP → v3)

Source: requirement "Ăn Bill — Requirement & UI/UX" (claude.ai artifact HLWU6Fiz62y68BKeas5xuN). User: "implement all … không làm unit test + evals test" → recommended option taken at every slice question, verification is `e2e-checklist.md` on the running app.

## 1 · Architecture it rests on

> `Shape: A (LangChain createAgent) · host: node — Next.js route handler on Vercel (serverless function) · transport: CopilotRuntime v2 + own AG-UI emitter (in-process AbstractAgent)` — `docs/adr/0002-agent-architecture.md`

Card rows used: Q4 **user writes** (tools propose, the confirm card calls `/api/admin/*` as the admin, undo 30 s) · Q5 admin password cookie, viewers anonymous · Q6 `PostgresSaver`, thread per day, 30 days · Q7 `gpt-5.4-mini` / `gpt-5.4-nano` / `gpt-5-nano` · Q9 evals deferred by the user.

| Task            | Example message                                                           | Agent     | Tool(s)                                                             |
| --------------- | ------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------- |
| create_match    | "3c real Thén thắng Dũ 15-11, bill 45k"                                   | assistant | `propose_matches` → card → `POST /api/admin/matches`                |
| create_matches  | "trưa nay: libre Bổ > Hi 40-32 bill 50k, 3c fake Lâm thắng Thén bill 30k" | assistant | `propose_matches` (array)                                           |
| update_match    | "sửa trận vừa rồi thành 15-13"                                            | assistant | `list_matches` → `propose_update` → `PATCH /api/admin/matches/:id`  |
| set_bill        | "trận vừa rồi bill 45k"                                                   | assistant | `propose_update` (bill only)                                        |
| delete_match    | "xóa trận libre lúc 12h20"                                                | assistant | `list_matches` → `propose_delete` → `DELETE /api/admin/matches/:id` |
| query_stats     | "tháng này ai đóng tiền nhiều nhất?"                                      | assistant | `query_stats` (rows + chart spec)                                   |
| head_to_head    | "Thén vs Lâm từ trước tới giờ"                                            | assistant | `head_to_head`                                                      |
| spin_wheel      | "quay cặp đấu, bỏ Lâm, Bổ x5"                                             | assistant | `spin_wheel` (frontend tool, browser)                               |
| generate_poster | "làm poster trận vừa rồi"                                                 | assistant | `generate_poster` (returns `/api/poster/:id` URL)                   |
| trash_talk      | "cà khịa Bổ đi"                                                           | assistant | `trash_talk` (stat facts; the model writes the line)                |
| out of scope    | "viết giúp tôi email xin nghỉ phép"                                       | assistant | none — declined by OUT OF SCOPE                                     |

## 2 · Fit check

Fits the ADR. Additions decided here, none widen it:

- **Predictions** (v3 "dự đoán"): viewers have no login, and `security.md` requires every mutating endpoint to be authenticated, so votes are entered by the admin on the prediction card (one tap per voter). No viewer write path.
- **Uploads** (avatar, highlight photo): stored in Postgres (`media`, bytea, ≤ 1.5 MB after client-side resize to 640 px), admin-only. No new system or credential (no Supabase Storage key). Clips are links.
- **Attendance** ("trưa nay ai đi?"): `sessions.attendees int[]`, admin toggles; feeds wheel defaults and Elo-balanced pairing.
- **Events**: `createMatches` writes `events` rows for special matches (streak broken, comeback, derby, blowout) and returns them so the UI plays the micro-moment.

## 3 · Inventory (before this feature)

| Piece                         | Paths                                                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Tools / registry              | none (`grep -rn "tool(" src/langchain` → 0)                                                                                            |
| Agents                        | `src/langchain/agent.ts` (skeleton, stale imports)                                                                                     |
| Zod schemas / DTOs            | `src/server/matches/schema.ts` (`matchInputSchema`, `matchPatchSchema`, `MatchView`, `PlayerRef`)                                      |
| Domain helpers                | `src/lib/domain.ts`, `src/lib/stats.ts`                                                                                                |
| HITL contract / pending store | none — ADR Q4 user writes                                                                                                              |
| Frontend renderers / cards    | none                                                                                                                                   |
| DB schema / repositories      | `src/db/schema.ts`; `src/server/{matches,players,audit}/repository.ts`, `src/server/matches/service.ts`, `src/server/stats/service.ts` |
| Routes                        | none (`find src/app` → missing)                                                                                                        |
| Screens / primitives          | none                                                                                                                                   |
| Guardrails                    | `src/langchain/guardrails/pii.ts`, `src/langchain/server/request-filter.ts`                                                            |
| Eval fixtures                 | removed (user: no evals)                                                                                                               |

## 4 · Slices

| #   | Slice                                                                                                | Layer         | Runs in                    | Decision                            | Existing piece                            | Why new                                          | Built by                                          |
| --- | ---------------------------------------------------------------------------------------------------- | ------------- | -------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| 1   | attendees, predictions, media, highlights                                                            | db            | server                     | new / extend `sessions`             | `src/db/schema.ts`                        | no table holds them                              | `/db-change` (inline, main session)               |
| 2   | admin write routes (matches, players, attendance, predictions, media, recap)                         | endpoint      | server                     | new                                 | `server/matches/service.ts`               | no routes exist                                  | `/api-endpoint`                                   |
| 3   | AG-UI emitter                                                                                        | transport     | server                     | new                                 | —                                         | no in-process adapter (ADR rung L3)              | `/agent-architect` decision, ai-engineer          |
| 4   | read + propose tools                                                                                 | tool          | agent                      | new                                 | `findMatches`, `resolvePlayerName`, stats | no tools exist                                   | `/agent-tool`                                     |
| 5   | confirm before write                                                                                 | confirm       | browser card → admin route | new                                 | —                                         | ADR Q4 user writes, not `/agent-hitl` interrupts | `/agent-hitl` (consulted; contract = user writes) |
| 6   | prompt, middleware, checkpointer                                                                     | agent scope   | agent                      | extend                              | `agent.ts`, `pii.ts`                      | —                                                | `/agent-graph`                                    |
| 7   | chat sheet, renderers, chips, mic, undo                                                              | chat frontend | browser                    | new                                 | —                                         | no chat UI                                       | `/agent-frontend` + `/agent-design-ui`            |
| 8   | spin_wheel in chat                                                                                   | frontend tool | browser                    | new (reuses wheel component of #10) | wheel                                     | browser-only effect                              | `/agent-frontend`                                 |
| 9   | posters                                                                                              | endpoint      | server                     | new                                 | stats                                     | no image route                                   | `/api-endpoint`                                   |
| 10  | screens: home, history, leaderboard, player, money, hall of fame, rivalry, wheel, wrapped, TV, admin | screens       | browser                    | new                                 | stats service                             | no screens                                       | `/ui-feature` → frontend-engineer                 |

Per the user's instruction, slices end on the E2E checklist, not on tests or evals.

## 6 · Duplicate check

Run over the whole tree on 2026-11-04 (`jscpd` not installed; grep for re-declared constants, schemas, helpers and renderers).

| Hit                                                                                                                                       | Decision                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `GAME_LABEL` declared three times (`components/ui/game-type-badge.tsx`, `app/api/poster/match/[id]/route.ts`, `langchain/tools/stats.ts`) | **fixed**: one copy in `src/lib/domain.ts`; the badge, poster route, stats tool, recap and 6 screens import it                               |
| Game-type colours in `langchain/tools/stats.ts` (hex, sent to the chat chart) and `features/player/components/type-chart.tsx` (CSS vars)  | **kept**: two copies in different forms. The tool result must carry literal colours because the chart renders them as data                   |
| Player-name resolution                                                                                                                    | **reuse**: `src/lib/names.ts` serves the tools and the browser (moved out of the tool in slice 4)                                            |
| Tool-result shapes                                                                                                                        | **reuse**: one contract in `src/lib/agent-results.ts`, parsed by `parseToolResult` in the single wildcard renderer                           |
| Confirm mechanism                                                                                                                         | **one**: `proposal-card.tsx` + `card-store.ts`; no second HITL path (no LangGraph interrupt)                                                 |
| `Intl.DateTimeFormat` outside `lib/domain.ts` (`context-snapshot.ts`, `home/lib/day-summary.ts`, `audit/lib/time.ts`)                     | **kept**: each needs a different format (full prompt timestamp, hour bucket, relative audit time) that `formatDate`/`formatTime` don't cover |
| Admin fetchers                                                                                                                            | **reuse**: `features/matches` `matchesApi` serves the chat cards and the history screen                                                      |
