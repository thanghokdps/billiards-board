"use client";

import { Check, Loader2, RotateCcw, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useState, useSyncExternalStore } from "react";

import { Ball } from "@/components/ui/ball";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MatchRow } from "@/components/ui/match-row";
import { AdminApiError, matchesApi, revertPatch, useMatchMoment } from "@/features/matches";
import type { Proposal } from "@/lib/agent-results";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/domain";

import {
  getCardState,
  registerCard,
  setCardState,
  subscribeCards,
  supersedeCards,
  UNDO_WINDOW_MS,
  type CardState,
} from "../lib/card-store";

function useCardState(id: string): CardState {
  return useSyncExternalStore(
    subscribeCards,
    () => getCardState(id),
    () => getCardState(id),
  );
}

function useCountdown(until: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [until]);
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
}

const idempotencyKey = (toolCallId: string) =>
  toolCallId
    .replace(/[^\w-]/g, "")
    .slice(0, 70)
    .padEnd(8, "0");

/** The confirm card (ADR Q4 user writes): shows what will be written, writes on tap, offers undo for 30 s. */
export function ProposalCard({ proposal, toolCallId }: { proposal: Proposal; toolCallId: string }) {
  const t = useTranslations("chat.card");
  const locale = useLocale();
  const router = useRouter();
  const playMoment = useMatchMoment();
  const state = useCardState(toolCallId);
  const secondsLeft = useCountdown(state.phase === "done" && state.undo ? state.at + UNDO_WINDOW_MS : null);

  async function confirm() {
    // Retrying after a failure is safe: the create carries the same idempotency key.
    const phase = getCardState(toolCallId).phase;
    if (phase !== "idle" && phase !== "failed" && phase !== "requested") return;
    setCardState(toolCallId, { phase: "saving" });
    try {
      let undo: () => Promise<void>;
      if (proposal.kind === "create") {
        const created = await matchesApi.create(
          proposal.matches.map((m) => m.input),
          "chat",
          idempotencyKey(toolCallId),
        );
        undo = async () => {
          await Promise.all(created.matches.map((m) => matchesApi.remove(m.id, "chat")));
        };
        playMoment(created.events);
      } else if (proposal.kind === "update") {
        await matchesApi.update(proposal.matchId, proposal.patch, "chat");
        undo = async () => {
          await matchesApi.update(proposal.matchId, revertPatch(proposal.before), "chat");
        };
        playMoment([]);
      } else {
        await matchesApi.remove(proposal.match.id, "chat");
        undo = async () => {
          await matchesApi.restore(proposal.match.id, "chat");
        };
        playMoment([]);
      }
      setCardState(toolCallId, { phase: "done", at: Date.now(), undo });
      router.refresh();
    } catch (error) {
      setCardState(toolCallId, { phase: "failed", reason: error instanceof AdminApiError ? error.code : "network" });
    }
  }

  const runConfirm = useEffectEvent(() => void confirm());

  useEffect(() => {
    registerCard(toolCallId);
    supersedeCards(proposal.supersedes);
  }, [toolCallId, proposal.supersedes]);

  useEffect(() => {
    if (state.phase === "requested") runConfirm();
  }, [state.phase]);

  async function runUndo() {
    const s = getCardState(toolCallId);
    if (s.phase !== "done" || !s.undo) return;
    setCardState(toolCallId, { phase: "saving" });
    try {
      await s.undo();
      setCardState(toolCallId, { phase: "undone" });
      router.refresh();
    } catch (error) {
      setCardState(toolCallId, { phase: "failed", reason: error instanceof AdminApiError ? error.code : "network" });
    }
  }

  const title =
    proposal.kind === "create"
      ? t("createTitle", { count: proposal.matches.length })
      : proposal.kind === "update"
        ? t("updateTitle")
        : t("deleteTitle");
  const createDates =
    proposal.kind === "create" ? new Set(proposal.matches.map((m) => m.input.date ?? proposal.date)) : new Set();

  return (
    <Card
      data-phase={state.phase}
      className={cn(
        "chat-card my-2",
        proposal.kind === "delete" ? "border-ball/40" : "border-lamp/30",
        state.phase === "superseded" && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <p className="font-display text-xl font-bold leading-tight">{title}</p>
        {proposal.kind === "create" && createDates.size === 1 && (
          <span className="text-xs text-ivory-muted">
            {t("date", { date: formatDate(proposal.matches[0]?.input.date ?? proposal.date, locale) })}
          </span>
        )}
      </div>

      <div className="divide-y divide-line px-3 py-1">
        {proposal.kind === "create" &&
          proposal.matches.map((m, i) => {
            const row = (
              <MatchRow
                key={i}
                compact={false}
                match={{
                  gameType: m.input.gameType,
                  format: m.input.format,
                  sideA: m.sideA,
                  sideB: m.sideB,
                  winnerSide: m.input.winnerSide,
                  scoreA: m.input.scoreA ?? null,
                  scoreB: m.input.scoreB ?? null,
                  scores: m.input.scores ?? [],
                  bill: m.input.bill ?? null,
                  tags: m.input.tags ?? [],
                  note: m.input.note ?? null,
                }}
              />
            );
            if (createDates.size === 1) return row;
            return (
              <Labeled key={i} label={t("date", { date: formatDate(m.input.date ?? proposal.date, locale) })}>
                {row}
              </Labeled>
            );
          })}
        {proposal.kind === "update" && (
          <>
            <Labeled label={t("before")}>
              <MatchRow match={proposal.before} className="opacity-60" />
            </Labeled>
            <Labeled label={t("after")}>
              <MatchRow match={proposal.after} className="rounded-sm bg-lamp/10 px-2" />
            </Labeled>
          </>
        )}
        {proposal.kind === "delete" && <MatchRow match={proposal.match} />}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-3" aria-live="polite">
        <CardFooter
          state={state}
          kind={proposal.kind}
          secondsLeft={secondsLeft}
          onConfirm={confirm}
          onCancel={() => setCardState(toolCallId, { phase: "cancelled" })}
          onUndo={runUndo}
        />
      </div>
    </Card>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <p className="text-xs font-medium text-ivory-muted">{label}</p>
      {children}
    </div>
  );
}

interface FooterProps {
  state: CardState;
  kind: Proposal["kind"];
  secondsLeft: number;
  onConfirm: () => void;
  onCancel: () => void;
  onUndo: () => void;
}

function CardFooter({ state, kind, secondsLeft, onConfirm, onCancel, onUndo }: FooterProps) {
  const t = useTranslations("chat.card");
  switch (state.phase) {
    case "idle":
      return (
        <>
          <Button variant={kind === "delete" ? "danger" : "primary"} onClick={onConfirm} className="flex-1">
            {kind === "delete" ? <Trash2 className="size-4" aria-hidden /> : <Check className="size-4" aria-hidden />}
            {kind === "delete" ? t("confirmDelete") : t("save")}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            <X className="size-4" aria-hidden />
            {t("cancel")}
          </Button>
        </>
      );
    case "requested":
    case "saving":
      return (
        <p className="flex items-center gap-2 text-sm text-ivory-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t("saving")}
        </p>
      );
    case "done":
      return (
        <>
          <p className="flex flex-1 items-center gap-2 text-sm font-bold text-win">
            <Ball className="chat-sunk size-5" />
            {kind === "create" ? t("saved") : kind === "update" ? t("updated") : t("deletedDone")}
          </p>
          {state.undo && secondsLeft > 0 && (
            <Button variant="outline" size="sm" onClick={onUndo}>
              <RotateCcw className="size-4" aria-hidden />
              {t("undo", { seconds: secondsLeft })}
            </Button>
          )}
        </>
      );
    case "undone":
      return <p className="text-sm text-ivory-muted">{t("undone")}</p>;
    case "cancelled":
      return <p className="text-sm text-ivory-muted">{t("cancelled")}</p>;
    case "superseded":
      return <p className="text-sm text-ivory-muted">{t("superseded")}</p>;
    case "failed":
      return (
        <>
          <p className="flex-1 text-sm font-semibold text-loss">{t("failed", { reason: state.reason })}</p>
          <Button variant="outline" size="sm" onClick={onConfirm}>
            <RotateCcw className="size-4" aria-hidden />
            {t("retry")}
          </Button>
        </>
      );
  }
}
