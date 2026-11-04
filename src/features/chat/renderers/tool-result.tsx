"use client";

import { useRenderTool } from "@copilotkit/react-core/v2";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { AGENT_ID, parseToolResult, TOOL_NAMES } from "@/lib/agent-results";

import { ProposalCard } from "./proposal-card";
import { AskChips, HeadToHeadCard, PosterCard, StatsCard, WheelCard } from "./result-cards";

interface ToolRenderProps {
  name: string;
  toolCallId: string;
  status: "inProgress" | "executing" | "complete";
  result: string | undefined;
}

/** Results the model only quotes in text: no card. */
const TEXT_ONLY = new Set<string>([TOOL_NAMES.listMatches, TOOL_NAMES.trashTalk]);

function Working() {
  const t = useTranslations("chat");
  return (
    <p className="my-2 inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-xs text-ivory-muted">
      <Loader2 className="size-4 animate-spin text-lamp" aria-hidden />
      {t("working")}
    </p>
  );
}

function Failure() {
  const t = useTranslations("chat");
  return (
    <p className="my-2 inline-flex items-center gap-2 rounded-full bg-loss/10 px-3 py-1.5 text-xs text-loss">
      <AlertTriangle className="size-4" aria-hidden />
      {t("toolFailed")}
    </p>
  );
}

function ToolResult({ name, toolCallId, status, result }: ToolRenderProps): ReactElement | null {
  if (status !== "complete") return <Working />;
  const parsed = parseToolResult(result);
  if (!parsed) return TEXT_ONLY.has(name) ? null : <Failure />;
  switch (parsed.status) {
    case "error":
      return <Failure />;
    case "needs_input":
    case "ambiguous_player":
    case "unknown_player":
      return <AskChips key={toolCallId} result={parsed} />;
    case "proposal":
      return <ProposalCard proposal={parsed} toolCallId={toolCallId} />;
    case "ok":
      break;
  }
  if (TEXT_ONLY.has(name)) return null;
  if (name === TOOL_NAMES.queryStats && "rows" in parsed) return <StatsCard result={parsed} />;
  if (name === TOOL_NAMES.headToHead && "aWins" in parsed) return <HeadToHeadCard result={parsed} />;
  if (name === TOOL_NAMES.spinWheel && "participants" in parsed) return <WheelCard result={parsed} />;
  if (name === TOOL_NAMES.generatePoster && "url" in parsed) return <PosterCard result={parsed} />;
  return <Failure />;
}

/** One wildcard renderer: every tool result goes through the shared contract in lib/agent-results. */
export function useToolRenderers() {
  useRenderTool(
    {
      name: "*",
      agentId: AGENT_ID,
      render: (props: ToolRenderProps) => <ToolResult {...props} />,
    },
    [],
  );
}
