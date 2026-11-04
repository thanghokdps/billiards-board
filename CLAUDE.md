@AGENTS.md

# Ăn Bill

Lunchtime-billiards scoreboard: public pages for viewers. The admin logs matches by chatting with a LangChain `createAgent` (id `assistant`) that only proposes writes; the admin confirms each on a card. Next.js 16 App Router on Vercel, Postgres (Supabase) via Drizzle, CopilotKit v2 chat, next-intl vi/en. Architecture: `docs/adr/0002-agent-architecture.md` (supersedes 0001).

Coordination (lanes, hard gates, review flow) comes from the global `~/.claude/CLAUDE.md` and the kit plugins. This file holds only what is specific to this repo.

## Agent Context

**All agents MUST read `.claude/docs/index.md` before scanning any source file.**

| Doc                             | Contents                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `.claude/docs/architecture.md`  | app / features / server / langchain layers, in-process AG-UI agent, one chat turn     |
| `.claude/docs/conventions.md`   | feature folders, boundaries, rejected patterns (hydration traps), pre-commit list     |
| `.claude/docs/stack.md`         | exact pins, Node 20.19, db and dev commands, Vercel + Supabase deploy                 |
| `.claude/docs/entry-points.md`  | pages, `/api/*` routes and their auth, scripts                                        |
| `.claude/docs/test-strategy.md` | no unit tests or evals (user decision); static gates, browser checks, live chat turns |

## Project Overview

| Path                              | Purpose                                                             |
| --------------------------------- | ------------------------------------------------------------------- |
| `src/app/`                        | pages (`[locale]/`) and route handlers (`api/`)                     |
| `src/features/`                   | UI per capability, incl. `chat/` (CopilotKit provider, tool cards)  |
| `src/server/`                     | repositories, services, auth, posters, env, `http.ts` route wrapper |
| `src/langchain/`                  | agent, prompts, tools, recap, PII, tracing, AG-UI emitter           |
| `src/lib/`                        | framework-free domain, stats, tool-result contract                  |
| `src/db/`, `drizzle/`, `scripts/` | schema, migrations, migrate/seed                                    |
| `messages/`                       | vi/en strings per namespace                                         |
| `docs/`                           | ADRs, feature slices, UI map, E2E checklist                         |

## Verify (in this order)

```bash
nvm use            # Node 20.19 (.nvmrc)
pnpm format:check
pnpm typecheck
pnpm lint
pnpm build
# agent changes: one real turn per touched flow (/agent-verify-turn, docs/e2e-checklist.md)
```

## Commit

`<type>: <description>` (no commitlint). No AI trailers (`.claude/rules/git.md`).

## Common Commands

```bash
pnpm db:up         # docker Postgres on :5433
pnpm db:migrate    # apply drizzle/*.sql (reads .env)
pnpm db:seed       # players + demo matches
pnpm dev           # next dev :3000
pnpm build && pnpm start
pnpm lint          # --fix sorts imports
pnpm typecheck
pnpm format
pnpm db:generate   # new migration from src/db/schema.ts
```

## Key Rules

- `pnpm` only — never npm/yarn; Node 20.19 via `nvm use`
- Never read, write or copy `.env`; new vars go in `src/server/env.ts` and `.env.example`
- Caller identity only from `readTrustedContext(runtime.context)`; no tool takes an identity field, no tool writes
- `LANGSMITH_TRACING` never `"true"`; tracing via `TRACING_PROVIDER` (masked)
- Pin `@copilotkit/*`, `@ag-ui/*`, `@langchain/*`, `langchain` exactly, bump together (pnpm `overrides`)
- No unit tests or evals unless the user asks
- TypeScript strict — `unknown` over `any`
