import { ChatOpenAI } from "@langchain/openai";

import type { ServerEnv } from "@/server/env";

export type ModelRole = "primary" | "fallback" | "cheap";

export type Models = Record<ModelRole, ChatOpenAI>;

/**
 * Three model roles (ADR Q7):
 * - primary answers the admin in the chat;
 * - fallback serves rate limits and outages (wired through `modelFallbackMiddleware`);
 * - cheap writes the lunch recap, never the chat answer.
 */
export function createModels(
  env: Pick<ServerEnv, "OPENAI_API_KEY" | "MODEL_PRIMARY" | "MODEL_FALLBACK" | "MODEL_CHEAP">,
): Models {
  const make = (model: string) => new ChatOpenAI({ model, apiKey: env.OPENAI_API_KEY, maxRetries: 1, timeout: 40_000 });
  return {
    primary: make(env.MODEL_PRIMARY),
    fallback: make(env.MODEL_FALLBACK),
    cheap: make(env.MODEL_CHEAP),
  };
}
