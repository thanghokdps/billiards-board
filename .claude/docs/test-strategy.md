# Test strategy

**No unit tests and no evals** (user decision, 2026-11-04). There is no test runner and no `pnpm test` / `pnpm evals` script. Do not add them unless the user asks.

## What proves a change instead

| Check | How |
| --- | --- |
| Static gates | `pnpm format:check && pnpm typecheck && pnpm lint && pnpm build` |
| Pages | Each route loads at 375 px and 1280 px with no horizontal overflow and no console or hydration errors, as viewer and as admin |
| Chat turns | `/agent-verify-turn`: drive a real turn in the browser and read the AG-UI stream from `/api/copilotkit` (tool name and args, `RUN_FINISHED`, no `RUN_ERROR`) |
| Flows | `docs/e2e-checklist.md`: create, confirm, undo, ask chips, edit, stats, head-to-head, wheel, poster, out of scope, injection, recap, in vi and en |
| Routes | `curl` with and without the admin cookie (expect 401 without) |

The local DB is docker `db` on :5433 (`pnpm db:up && pnpm db:migrate && pnpm db:seed`).

## If tests are added later

Ask the user where they live (`__tests__/` beside the code, or `tests/`). Start with the money and stats rules in `src/lib/stats.ts` and the route matrix in `src/app/api/admin/*`.
