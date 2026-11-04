import { AIMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";
import {
  createMiddleware,
  detectCreditCard,
  detectEmail,
  detectIP,
  piiMiddleware,
  type AgentMiddleware,
  type PIIDetector,
} from "langchain";

/** Types redacted on input. `url` is left out on purpose so pasted links (Figma, GitHub) survive. */
export const PII_TYPES = ["email", "credit_card", "ip"] as const;
export type PiiType = (typeof PII_TYPES)[number];

export const DEFAULT_DETECTORS: Record<PiiType, PIIDetector> = {
  email: detectEmail,
  credit_card: detectCreditCard,
  ip: detectIP,
};

/** Streamed when detection itself fails: carries no user input, and the model is never called. */
export const PII_FAILURE_REPLY = "Sorry, I couldn't process that message safely. Please try again.";

function lastHumanText(messages: BaseMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message && HumanMessage.isInstance(message)) {
      return typeof message.content === "string" ? message.content : JSON.stringify(message.content);
    }
  }
  return null;
}

/**
 * Fail-closed guard (L2, kit-owned): stock `piiMiddleware` has no error option, so a detector that
 * throws would fail the run or, worse, be skipped. This runs first, probes every detector on the
 * newest user message, and on any throw ends the run with a fixed reply before the model sees it.
 */
function piiFailClosedGuard(detectors: Record<PiiType, PIIDetector>) {
  return createMiddleware({
    name: "PIIFailClosedGuard",
    beforeModel: {
      canJumpTo: ["end"],
      hook: (state) => {
        const text = lastHumanText(state.messages);
        if (text === null) return undefined;
        try {
          for (const type of PII_TYPES) detectors[type](text);
          return undefined;
        } catch {
          return { messages: [new AIMessage(PII_FAILURE_REPLY)], jumpTo: "end" as const };
        }
      },
    },
  });
}

/** The PII middleware list for `createAgent`, or `[]` when the switch is off. */
export function createPiiMiddleware(
  enabled: boolean,
  detectors: Record<PiiType, PIIDetector> = DEFAULT_DETECTORS,
): AgentMiddleware[] {
  if (!enabled) return [];
  return [
    piiFailClosedGuard(detectors) as unknown as AgentMiddleware,
    ...PII_TYPES.map(
      (type) =>
        piiMiddleware(type, {
          strategy: "redact",
          detector: detectors[type],
          applyToInput: true,
        }) as unknown as AgentMiddleware,
    ),
  ];
}
