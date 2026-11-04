# Test Matrix — <slug>

## Status values

| Status      | Meaning                                        |
| ----------- | ---------------------------------------------- |
| planned     | Accepted as intended behavior, not implemented |
| in_progress | Actively being built                           |
| implemented | Implemented **and** proof exists               |
| changed     | Contract changed after earlier implementation  |
| retired     | No longer part of the contract                 |

## Matrix

| Behavior | Contract | Unit | Integration | Eval | Status  | Evidence |
| -------- | -------- | ---- | ----------- | ---- | ------- | -------- |
|          | no       | no   | no          | no   | planned | none     |

## Evidence rules

- **Unit / Eval** — none in this repo (user decision, 2026-11-04); mark the columns `n/a`
- **Integration** — a live turn through `/api/copilotkit` on `pnpm dev` (`/agent-verify-turn`), plus `curl` 401/404 checks on `/api/admin/*`
- **E2E** — the matching flow in `docs/e2e-checklist.md`, at 375 and 1280 px
- A row may ship without every column if SUMMARY.md explains why (e.g. tiny lane)
- `Evidence` points at the proof: test path, `Verify` row, or commit sha — never `none` for `implemented`
