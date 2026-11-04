# Escalations — <slug>

Default: **deny-on-no-response**. No recorded decision → work stays blocked.

---

<!-- Add entries when: hard gate fires, confidence is low, direction is ambiguous -->

Hard gates in this repo:

- An agent tool that writes data (tools only propose; writes stay in `/api/admin/*`)
- Any change to `src/server/auth/`, `requireAdmin`, or the trusted context built in `src/app/api/copilotkit/[[...path]]/route.ts`
- `src/langchain/server/agui-agent.ts` (which client messages are trusted, event order)
- Bumping `@copilotkit/*`, `@ag-ui/*`, `@langchain/*`, `langchain` (together, with a real turn)
- A destructive migration in `drizzle/`; anything that turns `LANGSMITH_TRACING` on

<!--
E001
- raised_by: <orchestrator | agent name>
- date: <YYYY-MM-DD>
- trigger: hard-gate | low-confidence | ambiguous-direction | in-flight | system-redefinition
- question: <one sentence — the decision needed>
- context: <one line — what work is blocked on this>
- options:
    - A) <option + consequence>
    - B) <option + consequence>
- default_if_no_response: BLOCK
- decision: pending
- decided_by:
- decided_at:
-->
