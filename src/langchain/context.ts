import { z } from "zod";

/**
 * Trusted run context (ADR Q5). Set only by the chat route after the admin cookie verified, passed to
 * the graph as `context`, read by middleware and tools through `runtime.context`. Never from a message,
 * a tool argument or forwarded props.
 */
export const agentContextSchema = z.object({
  adminId: z.string().min(1),
  locale: z.enum(["vi", "en"]),
  timeZone: z.string().min(1),
  // Not identity. The client only names ids; each entry is rebuilt from this thread's own checkpoint.
  openCards: z
    .array(z.object({ id: z.string(), kind: z.enum(["create", "update", "delete"]), proposal: z.string() }))
    .default([]),
  // Not identity either: only echoed back to the browser in a card decision.
  pageId: z.string().max(64).default(""),
});

export type AgentContext = z.infer<typeof agentContextSchema>;
export type OpenCard = AgentContext["openCards"][number];
/** What the chat route knows about the caller; the agent adds `openCards` and `pageId` per run. */
export type CallerContext = Omit<AgentContext, "openCards" | "pageId">;

/** Fail closed: anything that does not parse is no caller. */
export function readTrustedContext(context: unknown): AgentContext | null {
  const parsed = agentContextSchema.safeParse(context);
  return parsed.success ? parsed.data : null;
}
