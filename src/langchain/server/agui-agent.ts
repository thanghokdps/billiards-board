import "server-only";

import { randomUUID } from "node:crypto";

import { AbstractAgent } from "@ag-ui/client";
import { EventType, PROTOCOL_VERSION, type BaseEvent, type Message, type RunAgentInput } from "@ag-ui/core";
import { HumanMessage, type AIMessage, type ToolMessage } from "@langchain/core/messages";
import { Observable } from "rxjs";

import { AGENT_ID } from "@/lib/agent-results";
import { getServerEnv } from "@/server/env";

import { dailyThreadId, ensureCheckpointer, getAgent, RECURSION_LIMIT } from "../agent";
import type { AgentContext } from "../context";
import { createTurnTracing } from "../observability/tracing";

const MAX_INPUT_CHARS = 2000;

/** Text of the newest user message; the checkpoint holds the rest, so client history is never trusted. */
export function latestUserText(messages: Message[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role !== "user") continue;
    const content: unknown = m.content;
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.map((p: { type?: string; text?: string }) => (p.type === "text" ? (p.text ?? "") : "")).join(" ")
          : "";
    return text.trim().slice(0, MAX_INPUT_CHARS) || null;
  }
  return null;
}

function chunkText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((p: { type?: string; text?: string }) => (p?.type === "text" ? (p.text ?? "") : "")).join("");
}

type StreamEvent = {
  event: string;
  run_id: string;
  name?: string;
  data: Record<string, unknown>;
  parent_ids?: string[];
};

/**
 * In-process AG-UI agent (ADR 0002, rung L3): runs the compiled `createAgent` graph inside the
 * Next.js route and translates `streamEvents` v2 into AG-UI 1.0 events. Order kept per model call:
 * TEXT_MESSAGE_START → CONTENT* → TOOL_CALL_START/ARGS/END* → TEXT_MESSAGE_END, then each
 * TOOL_CALL_RESULT, and exactly one RUN_FINISHED or RUN_ERROR.
 */
export class LangChainGraphAgent extends AbstractAgent {
  private trusted: AgentContext;

  constructor(trusted: AgentContext) {
    super({ agentId: AGENT_ID, description: "Ăn Bill scorekeeper" });
    this.trusted = trusted;
  }

  override clone(): LangChainGraphAgent {
    const copy = super.clone() as LangChainGraphAgent;
    copy.trusted = this.trusted;
    return copy;
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((subscriber) => {
      const controller = new AbortController();
      const emit = (event: Record<string, unknown> & { type: EventType }) => subscriber.next(event as BaseEvent);
      const { threadId, runId } = input;

      void (async () => {
        emit({ type: EventType.RUN_STARTED, threadId, runId, protocolVersion: PROTOCOL_VERSION });
        try {
          await this.stream(input, emit, controller.signal);
          emit({ type: EventType.RUN_FINISHED, threadId, runId });
        } catch (error) {
          if (controller.signal.aborted) {
            emit({ type: EventType.RUN_FINISHED, threadId, runId });
          } else {
            console.error("[agent] run failed:", error instanceof Error ? error.message : error);
            emit({ type: EventType.RUN_ERROR, message: "The assistant failed. Try again.", code: "agent_error" });
          }
        }
        subscriber.complete();
      })();

      return () => controller.abort();
    });
  }

  private async stream(
    input: RunAgentInput,
    emit: (e: Record<string, unknown> & { type: EventType }) => void,
    signal: AbortSignal,
  ) {
    const text = latestUserText(input.messages);
    if (!text) return;
    const now = new Date();
    await ensureCheckpointer(now, this.trusted.timeZone);
    const tracing = createTurnTracing(getServerEnv(), { userId: this.trusted.adminId });
    const { agent } = getAgent();

    // The compiled graph's streamEvents takes the full RunnableConfig (metadata for masked tracing).
    const events = agent.graph.streamEvents(
      { messages: [new HumanMessage(text)] },
      {
        version: "v2",
        configurable: { thread_id: dailyThreadId(this.trusted.adminId, now, this.trusted.timeZone) },
        context: this.trusted,
        recursionLimit: RECURSION_LIMIT,
        signal,
        callbacks: tracing.callbacks,
        metadata: tracing.metadata,
      },
    );

    const open = new Map<string, { messageId: string; textStarted: boolean }>();
    let rootRunId: string | null = null;
    let anyText = false;

    for await (const raw of events as AsyncIterable<StreamEvent>) {
      rootRunId ??= raw.run_id;
      switch (raw.event) {
        case "on_chat_model_start":
          open.set(raw.run_id, { messageId: randomUUID(), textStarted: false });
          break;
        case "on_chat_model_stream": {
          const state = open.get(raw.run_id);
          const delta = chunkText((raw.data["chunk"] as { content?: unknown } | undefined)?.content);
          if (!state || !delta) break;
          if (!state.textStarted) {
            emit({ type: EventType.TEXT_MESSAGE_START, messageId: state.messageId, role: "assistant" });
            state.textStarted = true;
          }
          anyText = true;
          emit({ type: EventType.TEXT_MESSAGE_CONTENT, messageId: state.messageId, delta });
          break;
        }
        case "on_chat_model_end": {
          const state = open.get(raw.run_id);
          if (!state) break;
          open.delete(raw.run_id);
          const output = raw.data["output"] as AIMessage | undefined;
          for (const call of output?.tool_calls ?? []) {
            const toolCallId = call.id ?? randomUUID();
            emit({
              type: EventType.TOOL_CALL_START,
              toolCallId,
              toolCallName: call.name,
              parentMessageId: state.messageId,
            });
            emit({ type: EventType.TOOL_CALL_ARGS, toolCallId, delta: JSON.stringify(call.args ?? {}) });
            emit({ type: EventType.TOOL_CALL_END, toolCallId });
          }
          if (state.textStarted) emit({ type: EventType.TEXT_MESSAGE_END, messageId: state.messageId });
          break;
        }
        case "on_tool_end": {
          const message = raw.data["output"] as ToolMessage | undefined;
          if (!message?.tool_call_id) break;
          const content = typeof message.content === "string" ? message.content : JSON.stringify(message.content);
          emit({
            type: EventType.TOOL_CALL_RESULT,
            messageId: randomUUID(),
            toolCallId: message.tool_call_id,
            content,
            role: "tool",
          });
          break;
        }
        case "on_chain_end": {
          // A middleware that ends the run without a model call (PII fail-closed guard) still gets its reply shown.
          if (raw.run_id !== rootRunId || anyText) break;
          const messages = (raw.data["output"] as { messages?: AIMessage[] } | undefined)?.messages ?? [];
          const reply = chunkText(messages.at(-1)?.content);
          if (!reply) break;
          const messageId = randomUUID();
          emit({ type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" });
          emit({ type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: reply });
          emit({ type: EventType.TEXT_MESSAGE_END, messageId });
          break;
        }
      }
    }
  }
}
