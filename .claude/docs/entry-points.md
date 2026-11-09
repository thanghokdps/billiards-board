# Entry points

## Application start

- `pnpm dev` runs `next dev --port 3000`. `src/server/env.ts` validates env on first use: a bad value stops the request with every variable named, and an empty string counts as unset.
- `src/proxy.ts` (next-intl) prefixes the locale on every non-API path; `/` redirects to `/vi`.
- `src/app/[locale]/layout.tsx` → `AppShell` (`features/shell`). For the admin it also mounts `AdminChat` (CopilotKit provider + bottom sheet / side panel) and `MatchMomentOverlay`.

## Pages (`src/app/[locale]/`, public unless noted)

`/` today's table · `/history` · `/leaderboard` · `/players/[slug]` (FIFA card) · `/money` · `/hall-of-fame` · `/rivalry` · `/wheel` · `/submit` (signed-in member schedules or records a match they play in, on the 3D table; `?id=` enters the result of a temp match; the admin approves) · `/wrapped`, `/wrapped/[slug]` · `/tv` · `/audit` · `/admin` (login; pending submissions with approve / edit / reject, players and settings)

## API routes (`src/app/api/`)

| Route | Auth | What |
| --- | --- | --- |
| `POST /api/admin/login`, `POST /api/admin/logout` | password; 429 + `retry-after` after 5 failures / 15 min | admin cookie |
| `POST /api/admin/matches`, `PATCH`/`DELETE /api/admin/matches/[id]`, `POST …/[id]/restore` | admin cookie | match writes (create takes an idempotency key), audited |
| `POST`/`DELETE /api/admin/matches/[id]/highlights[/hid]` | admin cookie | highlight photos |
| `/api/admin/players[/id]`, `POST /api/admin/media` | admin cookie | players, uploads (bytea) |
| `POST /api/admin/guests` | admin cookie | quick-add a named guest from the wheel (`{ name }` → bare `PlayerRef`, idempotent by name, 409 on a member's name) |
| `GET /api/auth/google?returnTo=`, `GET /api/auth/google/callback` | public; 404 unless `GOOGLE_CLIENT_ID`/`SECRET` set | OAuth code + PKCE; state in signed `anbill_oauth` (10 min); a member whose `players.email` matches gets `anbill_player`, an `ADMIN_EMAILS` email also gets the admin cookie; failures land on `returnTo?login=failed|denied` |
| `POST /api/auth/logout` | none | clears member + admin cookies |
| `POST /api/my/matches` | member cookie | schedule a temp match the caller plays in → `match_submissions` row `scheduled`; 409 `busy` if any seated member already has an unplayed one (checked under an advisory lock) |
| `GET`/`PATCH /api/my/matches/[id]` | member cookie, seated (else 404) | read for prefill / change players, format, time while `scheduled` |
| `POST /api/my/matches/[id]/result`, `…/cancel` | member cookie, seated (else 404) | result → `pending` (also fixes a pending one); cancel only while `scheduled` (409 otherwise) |
| `GET /api/admin/submissions` | admin cookie | `{ submissions }`: pending proposals (≤ 50, newest first) with seats resolved |
| `POST /api/admin/submissions/[id]/approve` | admin cookie | `{ edited?, via? }` → `{ matchId, submission }`; creates typed guests, then the match (key `sub-<id>`), audited; repeat returns the same match, 409 if rejected |
| `POST /api/admin/submissions/[id]/reject` | admin cookie | `{ via? }` → `{ submission }`, audited; 409 if approved |
| `POST /api/admin/recap` | admin cookie | day bulletin from `MODEL_CHEAP` (`src/langchain/recap.ts`); 404 when no matches |
| `GET/POST /api/copilotkit/*` | admin cookie (401 otherwise) | CopilotKit v2 runtime → `LangChainGraphAgent` |
| `GET /api/media/[id]` | public | stored image |
| `GET /api/poster/match/[id]`, `/wanted/[slug]`, `/rivalry` | public, cached 60 s / CDN 300 s | 1080×1350 PNG via Satori |

## Background jobs / webhooks

None. Chat threads older than 30 days are pruned on the first chat turn per instance (`ensureCheckpointer`).

## Scripts

| Script | What it does |
| --- | --- |
| `scripts/migrate.ts` (`pnpm db:migrate`) | applies `drizzle/*.sql` |
| `scripts/seed.ts` (`pnpm db:seed`) | the five players plus demo matches |
