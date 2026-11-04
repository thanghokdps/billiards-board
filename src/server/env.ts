import "server-only";

import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: nonEmpty,

    OPENAI_API_KEY: nonEmpty,
    MODEL_PRIMARY: nonEmpty.default("gpt-5.4-mini"),
    MODEL_FALLBACK: nonEmpty.default("gpt-5.4-nano"),
    MODEL_CHEAP: nonEmpty.default("gpt-5-nano"),

    /** The one admin password. Viewers never log in. */
    ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),
    /** HMAC key for the admin session cookie. */
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),

    APP_TIMEZONE: nonEmpty.default("Asia/Ho_Chi_Minh"),

    TRACING_PROVIDER: z.enum(["none", "langsmith"]).default("none"),
    LANGSMITH_API_KEY: z.string().trim().min(1).optional(),
    LANGSMITH_PROJECT: nonEmpty.default("billiards-board"),
    LANGSMITH_ENDPOINT: z.url().default("https://api.smith.langchain.com"),
    /** Shown on traces as metadata (LangSmith "agent" / environment filters). */
    LANGSMITH_AGENT_ID: nonEmpty.default("billiards-board"),
    LANGSMITH_AGENT_ENVIRONMENT: nonEmpty.default("local"),
    /** Must stay off: `true` turns on LangChain's global auto-tracer, which bypasses masking. */
    LANGSMITH_TRACING: z.enum(["true", "false", ""]).optional(),
    TRACE_HASH_KEY: z.string().min(16).optional(),

    PII_REDACTION: z.enum(["on", "off"]).default("on"),
  })
  .superRefine((env, ctx) => {
    if (env.TRACING_PROVIDER === "langsmith" && !env.LANGSMITH_API_KEY) {
      ctx.addIssue({ code: "custom", path: ["TRACING_PROVIDER"], message: "langsmith needs LANGSMITH_API_KEY" });
    }
    if (env.LANGSMITH_TRACING === "true") {
      ctx.addIssue({
        code: "custom",
        path: ["LANGSMITH_TRACING"],
        message:
          'set LANGSMITH_TRACING="false" and TRACING_PROVIDER="langsmith": the auto-tracer sends unmasked prompts',
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  // `.env.example` ships optional secrets as "": an empty value means unset, not invalid.
  const present = Object.fromEntries(Object.entries(source).filter(([, v]) => v !== ""));
  const result = serverEnvSchema.safeParse(present);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`);
    throw new Error(`Invalid environment (see .env.example):\n${lines.join("\n")}`);
  }
  return result.data;
}

let cached: ServerEnv | undefined;

/** Validated once per server instance; a missing variable fails the first request with one clear message. */
export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
