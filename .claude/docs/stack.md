# Stack

Runtime: Node 20.19.0 (`.nvmrc`; run `nvm use` first, the shell default here is 18). Package manager: pnpm 8.11 only.

## Key dependencies (exact pins)

| Package | Version | Role |
| --- | --- | --- |
| `next` | 16.4.4 | App Router, route handlers, `next/og` posters, `next/root-params` |
| `react` / `react-dom` | 19.3.1 | UI |
| `next-intl` | 4.14.9 | vi/en routing and messages (`src/i18n/`, `messages/`) |
| `tailwindcss` | 4.3.4 | `@theme` tokens in `src/styles/globals.css` |
| `radix-ui`, `lucide-react`, `sonner`, `motion`, `recharts`, `canvas-confetti` | 1.8.1, 1.67.0, 2.0.8, 14.9.0, 3.10.1, 1.9.4 | primitives, icons, toasts, animation, charts, confetti |
| `drizzle-orm` / `drizzle-kit`, `pg` | 0.45.4 / 0.31.11, 8.23.1 | schema, migrations, queries |
| `langchain` | 1.6.1 | `createAgent` and the stock middleware |
| `@langchain/core` / `@langchain/langgraph` | 1.3.4 / 1.6.0 | one copy each (pnpm `overrides`) |
| `@langchain/langgraph-checkpoint-postgres` | 1.1.2 | durable chat threads |
| `@langchain/openai` | 1.8.0 | `ChatOpenAI` |
| `@copilotkit/runtime` / `@copilotkit/react-core` | 1.84.0 | v2 runtime handler, `CopilotChat`, `useRenderTool` |
| `@ag-ui/client` / `@ag-ui/core` | 1.0.2 | `AbstractAgent`, events (overridden to CopilotKit's version) |
| `langsmith` | 0.11.7 | masked tracing |
| `zod` | 4.6.7 | env, request and tool schemas |

Dev tools: TypeScript 5.9.3 (strict), ESLint 10.14 + typescript-eslint 8.72.1 (`no-deprecated`), `@next/eslint-plugin-next`, react-hooks 7.1.1, import-x 4.17.1, Prettier 3.9.10 (`printWidth` 120), tsx 4.23.15.

Note: pnpm keeps a second peer variant of `@copilotkit/core` (built against zod 3) for `@copilotkit/channels-*`, which the runtime pulls in and this app never imports. The browser bundle has one copy.

## Commands

| Task | Command |
| --- | --- |
| Local DB (docker, :5433) | `pnpm db:up` |
| Migrations / seed | `pnpm db:migrate` / `pnpm db:seed` (read `.env`) |
| New migration from the schema | `pnpm db:generate` |
| Dev server (:3000) | `pnpm dev` |
| Prod build / start | `pnpm build` / `pnpm start` |
| Lint | `pnpm lint` (`--fix` sorts imports) |
| Type check | `pnpm typecheck` |
| Format | `pnpm format` / `pnpm format:check` |

No unit tests or evals by user decision; see [test-strategy.md](test-strategy.md).

## Deploy

Vercel and Supabase Postgres. Only `main` deploys (`vercel.json`, `git.deploymentEnabled`): env vars exist for Production only, so a branch build cannot pass. Set every name in `.env.example` as a Vercel env var. Run `pnpm db:migrate` (and `pnpm db:seed` once) against the Supabase URL. `LANGSMITH_TRACING` stays `"false"`; tracing goes through `TRACING_PROVIDER` only, which keeps it masked.
