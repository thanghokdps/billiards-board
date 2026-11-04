# Summary — <slug>

Lane: tiny | normal | high-risk
Confidence: high | medium | low
Reason: <one sentence — which flags fired, or "none">
Flags: <comma-separated risk flags, or `none`>
Input-type: new spec | spec slice | change request | new initiative | maintenance | harness improvement

> `Lane` drives **ceremony** (how much proof). `Confidence` drives **interruption** (whether human is asked).
> A hard gate forces `high-risk`. Low confidence escalates regardless of lane.

## What changed

<filled by Implementer / Debugger / Refactorer after completing work>

## Rationale

<filled by Planner>

## Alternatives considered

- none

## Deviations

- none

## Verify

| Check                       | Command     | Exit | Notes |
| --------------------------- | ----------- | ---- | ----- |
| Format                      | `pnpm format:check` | 0 | |
| Types                       | `pnpm typecheck` | 0 | |
| Lint                        | `pnpm lint` | 0 | includes `@typescript-eslint/no-deprecated` |
| Build                       | `pnpm build` | 0 | no unit tests or evals in this repo (user decision) |
| Pages                       | browser at 375 / 1280 px | — | no overflow, no console or hydration errors |
| Real turn (agent changes)   | `/agent-verify-turn` per touched flow | — | ends `RUN_FINISHED`, no `RUN_ERROR` |

## Rollback

- `git revert <sha>`

## Harness-Delta

- none
