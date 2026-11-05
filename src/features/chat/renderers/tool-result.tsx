"use client";

import { useRenderTool } from "@copilotkit/react-core/v2";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, type ReactElement } from "react";

import { Ball } from "@/components/ui/ball";
import { AGENT_ID, parseToolResult, TOOL_NAMES, type CardDecision } from "@/lib/agent-results";

import { ProposalCard } from "./proposal-card";
import { AskChips, HeadToHeadCard, PosterCard, StatsCard, WheelCard } from "./result-cards";
import { applyCardDecision } from "../lib/card-store";

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
      <span aria-hidden className="felt relative h-4 w-10 overflow-hidden rounded-full">
        <span className="absolute inset-y-0 left-1/2 -ml-2 animate-roll">
          <Ball color="var(--color-lamp)" number={1} className="block size-4" />
        </span>
      </span>
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

/** Renders nothing: the open card above shows the outcome. */
function ApplyCardDecision({ toolCallId, result }: { toolCallId: string; result: CardDecision }) {
  useEffect(() => applyCardDecision(toolCallId, result), [toolCallId, result]);
  return null;
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
    case "card_decision":
      return <ApplyCardDecision toolCallId={toolCallId} result={parsed} />;
    case "card_notice":
      return null;
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
