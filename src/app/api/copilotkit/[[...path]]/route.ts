import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
import { NextResponse } from "next/server";

import { LangChainGraphAgent } from "@/langchain/server/agui-agent";
import { AGENT_ID } from "@/lib/agent-results";
import { isAdminRequest } from "@/server/auth/session";
import { getServerEnv } from "@/server/env";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Chat UI language; not identity, so a client value is fine once checked against the enum. */
function localeOf(request: Request): "vi" | "en" {
  return request.headers.get("x-anbill-locale") === "en" ? "en" : "vi";
}

const copilotRuntime = new CopilotRuntime({
  // Per request, after the admin cookie verified: the trusted context is built here, never from the body.
  agents: async ({ request }) => {
    if (!(await isAdminRequest(request))) throw new Error("unauthenticated");
    return {
      [AGENT_ID]: new LangChainGraphAgent({
        adminId: "admin",
        locale: localeOf(request),
        timeZone: getServerEnv().APP_TIMEZONE,
      }),
    };
  },
});

const handler = createCopilotRuntimeHandler({ runtime: copilotRuntime, basePath: "/api/copilotkit" });

/** Admin only (ADR Q5): viewers have no chat, so every runtime route answers 401 without the cookie. */
async function handle(request: Request): Promise<Response> {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return handler(request);
}

export { handle as GET, handle as POST };
