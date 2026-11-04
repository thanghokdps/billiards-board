# Conventions

## Naming

- Files kebab-case (`proposal-card.tsx`, `login-limit.ts`); components PascalCase, one per file; hooks `use-*.ts`.
- Constants `SCREAMING_SNAKE_CASE` (`AGENT_ID`, `TOOL_NAMES`, `GAME_LABEL`, `RECURSION_LIMIT`).
- Tool names and result shapes live once in `src/lib/agent-results.ts`; prompts, tools and renderers import them.

## Structure

- Pages in `src/app/[locale]/` are thin. They own their width and gutter (`mx-auto max-w-5xl px-4`); the shell's `<main>` has neither.
- One folder per feature in `src/features/`, imported only through its `index.ts`.
- Server code in `src/server/<aggregate>/`. It never imports React, `features/` or `components/`. Display constants the server needs go in `src/lib/`.
- Agent code in `src/langchain/`. Kit concerns get their own folder (`config/`, `guardrails/`, `observability/`, `server/`); tools go in `tools/`.
- Strings live in `messages/{vi,en}/<namespace>.json`, and a new namespace is added to `src/i18n/namespaces.ts`.

## Imports

ESLint `import-x/order`: builtin → external → `@/` internal → relative, with blank lines between groups. `pnpm lint --fix` sorts them.

## Anti-patterns (rejected here)

- Identity from a message, tool argument, header or client body: only `readTrustedContext(runtime.context)`.
- A tool that writes. Writes are proposals; the card calls `/api/admin/*`.
- Deprecated symbols (lint `no-deprecated`): `setRequestLocale`, recharts `Cell`, Next `Image priority` (use `loading="eager"`), CopilotKit `showDevConsole`.
- Values that render differently on Node and Chrome: raw `Math.cos`/`sin` output in SVG attributes (round them), `Intl` short Vietnamese weekdays (`formatDate` builds them by hand).
- A `useSyncExternalStore` snapshot that returns a new object on each read (it loops forever).
- Raw hex or `[Npx]` values in components: use the tokens in `globals.css`.
- Editing `.env` from the agent; new names go in `src/server/env.ts` and `.env.example`.

## Before every commit

- [ ] `pnpm format:check && pnpm typecheck && pnpm lint && pnpm build`
- [ ] Agent or prompt changed → one real turn per touched flow (`/agent-verify-turn`, checklist in `docs/e2e-checklist.md`)
- [ ] New env var → `src/server/env.ts` + `.env.example`
- [ ] Commit `<type>: <description>`, without AI trailers
