import "server-only";

import type { RunAgentInput } from "@ag-ui/core";
import { ToolMessage, type BaseMessage } from "@langchain/core/messages";

import { CHAT_PAGE_CONTEXT, OPEN_CARDS_CONTEXT, parseToolResult } from "@/lib/agent-results";

import type { OpenCard } from "../context";

const MAX_OPEN_CARDS = 20;

/** Ids only: whether a card is open is known to the browser, what it proposes is read from the checkpoint. */
export function openCardIds(context: RunAgentInput["context"]): string[] {
  const value = context.find((c) => c.description === OPEN_CARDS_CONTEXT)?.value ?? "";
  return value.split(",").filter(Boolean).slice(0, MAX_OPEN_CARDS);
}

export function chatPageId(context: RunAgentInput["context"]): string {
  return context.find((c) => c.description === CHAT_PAGE_CONTEXT)?.value ?? "";
}

/** Keeps only ids that are proposals of this thread, so a forged id has nothing to resolve or supersede. */
export function openCardsFrom(ids: string[], messages: BaseMessage[]): OpenCard[] {
  const results = messages.flatMap((message) => {
    if (!ToolMessage.isInstance(message) || typeof message.content !== "string") return [];
    return [{ id: message.tool_call_id, content: message.content, result: parseToolResult(message.content) }];
  });
  // A reload forgets decisions in the browser; card taps never reach the checkpoint, so those can still look open.
  const closed = new Set(
    results.flatMap(({ result }) => {
      if (result?.status === "proposal") return result.supersedes;
      return result?.status === "card_decision" ? result.cardIds : [];
    }),
  );
  return results.flatMap(({ id, content, result }) => {
    if (result?.status !== "proposal" || !ids.includes(id) || closed.has(id)) return [];
    return [{ id, kind: result.kind, proposal: content }];
  });
}
