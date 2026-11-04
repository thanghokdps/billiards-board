import "server-only";

import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import {
  createAgent,
  createMiddleware,
  dynamicSystemPromptMiddleware,
  HumanMessage,
  modelFallbackMiddleware,
  SystemMessage,
  toolCallLimitMiddleware,
  toolErrorMiddleware,
  ToolInvocationError,
  ToolMessage,
  toolRetryMiddleware,
  type AgentMiddleware,
} from "langchain";

import { getPool } from "@/db/client";
import { TOOL_NAMES } from "@/lib/agent-results";
import { localDate } from "@/lib/domain";
import { getServerEnv } from "@/server/env";

import { createModels } from "./config/models";
import { agentContextSchema, readTrustedContext } from "./context";
import { loadContextSnapshot } from "./context-snapshot";
import { createPiiMiddleware } from "./guardrails/pii";
import { buildSystemPrompt, OPEN_CARD_REMINDER } from "./prompts";
import { TOOLS } from "./tools";

/**
 * Per-run cap on graph super-steps. Each middleware hook is its own node, so with PII on one
 * model → tools round is ~10 steps; 60 allows ~5 rounds. Tool cost is capped separately (12 calls).
 */
export const RECURSION_LIMIT = 60;
export const THREAD_RETENTION_DAYS = 30;

const TOOL_FAILURE_REPLY = "The database did not answer. Tell the admin to try again in a moment.";
const TOOL_BAD_INPUT_NOTE =
  "Never change a value the admin gave to fit a limit: tell them which value is not accepted and ask for another.";

const DECIDING_TOOLS = new Set<string>([
  TOOL_NAMES.proposeMatches,
  TOOL_NAMES.proposeUpdate,
  TOOL_NAMES.proposeDelete,
  TOOL_NAMES.resolveCard,
]);

/** Added to the model call only, never to the checkpoint, and dropped once this turn has acted on the card. */
const openCardReminder = createMiddleware({
  name: "OpenCardReminder",
  wrapModelCall: (request, handler) => {
    if (!readTrustedContext(request.runtime.context)?.openCards.length) return handler(request);
    const turn = request.messages.slice(request.messages.findLastIndex((m) => HumanMessage.isInstance(m)) + 1);
    if (turn.some((m) => ToolMessage.isInstance(m) && DECIDING_TOOLS.has(m.name ?? ""))) return handler(request);
    return handler({ ...request, messages: [...request.messages, new SystemMessage(OPEN_CARD_REMINDER)] });
  },
});

/** Order is a contract: PII redaction sees input first; fallback wraps the model; the prompt is set last. */
function buildMiddleware(models: ReturnType<typeof createModels>, piiOn: boolean): AgentMiddleware[] {
  return [
    ...createPiiMiddleware(piiOn),
    toolCallLimitMiddleware({ runLimit: 12 }) as unknown as AgentMiddleware,
    toolRetryMiddleware({ maxRetries: 1, tools: TOOLS }) as unknown as AgentMiddleware,
    // Bad arguments are the model's to fix or explain; only a real tool failure is "try again later".
    toolErrorMiddleware({
      onError: (error) =>
        ToolInvocationError.isInstance(error) ? `${error.message}\n${TOOL_BAD_INPUT_NOTE}` : TOOL_FAILURE_REPLY,
    }) as unknown as AgentMiddleware,
    modelFallbackMiddleware(models.fallback) as unknown as AgentMiddleware,
    openCardReminder as unknown as AgentMiddleware,
    dynamicSystemPromptMiddleware(async (_state, runtime) => {
      const context = readTrustedContext(runtime.context);
      if (!context) throw new Error("no trusted caller");
      return buildSystemPrompt(await loadContextSnapshot(context, new Date()));
    }) as unknown as AgentMiddleware,
  ];
}

const globalForAgent = globalThis as unknown as {
  __anbillAgent?: ReturnType<typeof build>;
  __anbillSetup?: Promise<void>;
};

function build() {
  const env = getServerEnv();
  const models = createModels(env);
  const checkpointer = new PostgresSaver(getPool());
  const agent = createAgent({
    model: models.primary,
    tools: TOOLS,
    middleware: buildMiddleware(models, env.PII_REDACTION === "on"),
    contextSchema: agentContextSchema,
    checkpointer,
  });
  return { agent, checkpointer };
}

/** Compiled once per server instance (warm serverless starts reuse it), never per request. */
export function getAgent() {
  globalForAgent.__anbillAgent ??= build();
  return globalForAgent.__anbillAgent;
}

/** One chat thread per admin per day (ADR Q6). */
export function dailyThreadId(adminId: string, now: Date, timeZone: string): string {
  return `${adminId}-${localDate(now, timeZone)}`;
}

/** Creates the checkpoint tables once, and drops threads older than the retention window. */
export function ensureCheckpointer(now: Date, timeZone: string): Promise<void> {
  globalForAgent.__anbillSetup ??= (async () => {
    const { checkpointer } = getAgent();
    await checkpointer.setup();
    const cutoff = localDate(new Date(now.getTime() - THREAD_RETENTION_DAYS * 86_400_000), timeZone);
    const { rows } = await getPool().query<{ thread_id: string }>(
      "select distinct thread_id from checkpoints where thread_id ~ '-\\d{4}-\\d{2}-\\d{2}$' and right(thread_id, 10) < $1",
      [cutoff],
    );
    await Promise.all(rows.map((r) => checkpointer.deleteThread(r.thread_id)));
  })().catch((error: unknown) => {
    globalForAgent.__anbillSetup = undefined;
    throw error;
  });
  return globalForAgent.__anbillSetup;
}
