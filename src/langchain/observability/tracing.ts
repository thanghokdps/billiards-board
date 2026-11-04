import { createHmac } from "node:crypto";

import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";
import { Client } from "langsmith";

import type { ServerEnv } from "@/server/env";

/** Metadata keys allowed into a trace. Everything else (messages, prompts, caller names) is dropped. */
const METADATA_ALLOWLIST = new Set([
  "thread_id",
  "run_id",
  "assistant_id",
  "graph_id",
  "agent",
  "environment",
  "user_hash",
  "ls_provider",
  "ls_model_name",
  "ls_model_type",
  "ls_temperature",
]);

export function hashUserId(userId: string, key: string): string {
  return createHmac("sha256", key).update(userId).digest("hex").slice(0, 32);
}

/** Masks a metadata map to the allowlist. Exported for tests. */
export function maskMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(metadata).filter(([key]) => METADATA_ALLOWLIST.has(key)));
}

/** Keeps only token usage from run outputs: message text and tool results never leave the process. */
export function maskOutputs(outputs: Record<string, unknown>): Record<string, unknown> {
  const usage: Record<string, unknown> = {};
  const visit = (value: unknown, depth: number) => {
    if (!value || typeof value !== "object" || depth > 6) return;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if ((key === "usage_metadata" || key === "tokenUsage") && child && typeof child === "object") {
        Object.assign(usage, child);
      } else {
        visit(child, depth + 1);
      }
    }
  };
  visit(outputs, 0);
  return Object.keys(usage).length > 0 ? { usage } : {};
}

let client: Client | undefined;

type TracingEnv = Pick<
  ServerEnv,
  | "TRACING_PROVIDER"
  | "LANGSMITH_API_KEY"
  | "LANGSMITH_PROJECT"
  | "LANGSMITH_ENDPOINT"
  | "LANGSMITH_AGENT_ID"
  | "LANGSMITH_AGENT_ENVIRONMENT"
  | "TRACE_HASH_KEY"
>;

/**
 * Per-turn trace callbacks, chosen by TRACING_PROVIDER (default `none`).
 * Masking is always on: inputs dropped, outputs reduced to token usage, metadata allowlisted,
 * and the caller id reaches the trace only as an HMAC.
 */
export interface TurnTracing {
  callbacks: BaseCallbackHandler[];
  metadata: Record<string, string>;
}

export function createTurnTracing(env: TracingEnv, turn: { userId: string | null }): TurnTracing {
  if (env.TRACING_PROVIDER === "none") return { callbacks: [], metadata: {} };
  try {
    client ??= new Client({
      apiKey: env.LANGSMITH_API_KEY,
      apiUrl: env.LANGSMITH_ENDPOINT,
      hideInputs: () => ({}),
      hideOutputs: (outputs) => maskOutputs(outputs),
      hideMetadata: (metadata) => maskMetadata(metadata),
    });
    const tracer = new LangChainTracer({ client, projectName: env.LANGSMITH_PROJECT });
    const metadata: Record<string, string> = {
      agent: env.LANGSMITH_AGENT_ID,
      environment: env.LANGSMITH_AGENT_ENVIRONMENT,
      ...(turn.userId && env.TRACE_HASH_KEY ? { user_hash: hashUserId(turn.userId, env.TRACE_HASH_KEY) } : {}),
    };
    return { callbacks: [tracer], metadata };
  } catch (error) {
    // Tracing never fails a turn.
    console.warn("[tracing] disabled for this turn:", error instanceof Error ? error.message : error);
    return { callbacks: [], metadata: {} };
  }
}
