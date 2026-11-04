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
});

export type AgentContext = z.infer<typeof agentContextSchema>;

/** Fail closed: anything that does not parse is no caller. */
export function readTrustedContext(context: unknown): AgentContext | null {
  const parsed = agentContextSchema.safeParse(context);
  return parsed.success ? parsed.data : null;
}
