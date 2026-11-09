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
import { submissionsApi } from "@/features/submissions";
import type { Proposal } from "@/lib/agent-results";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/domain";

import { SubmissionBody } from "./submission-card";
import {
  getCardState,
  registerCard,
  setCardState,
  subscribeCards,
  supersedeCards,
  UNDO_WINDOW_MS,
  type CardState,
} from "../lib/card-store";

/** What a card does: a proposal kind, or for a submission whether it approves or rejects. */
type CardAction = "create" | "update" | "delete" | "approve" | "reject";

const actionOf = (proposal: Proposal): CardAction =>
  proposal.kind === "submission" ? proposal.decision : proposal.kind;

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
      let undo: (() => Promise<void>) | null = null;
      if (proposal.kind === "submission") {
        // Both calls are idempotent on the server, so a retry after a dropped response is safe. No undo: the admin
        // deletes an approved match from the match itself, and a rejection is final.
        if (proposal.decision === "approve") {
          await submissionsApi.approve(proposal.submissionId, { via: "chat" });
          playMoment([]);
        } else {
          await submissionsApi.reject(proposal.submissionId, { via: "chat" });
        }
      } else if (proposal.kind === "create") {
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

  const action = actionOf(proposal);
  const title =
    proposal.kind === "create"
      ? t("createTitle", { count: proposal.matches.length })
      : proposal.kind === "update"
        ? t("updateTitle")
        : t(action === "approve" ? "approveTitle" : action === "reject" ? "rejectTitle" : "deleteTitle");
  const createDates =
    proposal.kind === "create" ? new Set(proposal.matches.map((m) => m.input.date ?? proposal.date)) : new Set();
  const headerDate =
    proposal.kind === "create" && createDates.size === 1
      ? (proposal.matches[0]?.input.date ?? proposal.date)
      : proposal.kind === "submission"
        ? proposal.submission.date
        : null;

  return (
    <Card
      data-phase={state.phase}
      className={cn(
        "chat-card my-2",
        action === "delete" || action === "reject" ? "border-ball/40" : "border-lamp/30",
        state.phase === "superseded" && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <p className="font-display text-xl font-bold leading-tight">{title}</p>
        {headerDate && (
          <span className="text-xs text-ivory-muted">{t("date", { date: formatDate(headerDate, locale) })}</span>
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
        {proposal.kind === "submission" && <SubmissionBody submission={proposal.submission} />}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-3" aria-live="polite">
        <CardFooter
          state={state}
          action={action}
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
  action: CardAction;
  secondsLeft: number;
  onConfirm: () => void;
  onCancel: () => void;
  onUndo: () => void;
}

const CONFIRM_LABEL = {
  create: "save",
  update: "save",
  delete: "confirmDelete",
  approve: "approve",
  reject: "reject",
} as const;

const DONE_LABEL = {
  create: "saved",
  update: "updated",
  delete: "deletedDone",
  approve: "approved",
  reject: "rejected",
} as const;

function CardFooter({ state, action, secondsLeft, onConfirm, onCancel, onUndo }: FooterProps) {
  const t = useTranslations("chat.card");
  const destructive = action === "delete" || action === "reject";
  switch (state.phase) {
    case "idle":
      return (
        <>
          <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} className="flex-1">
            {action === "delete" ? (
              <Trash2 className="size-4" aria-hidden />
            ) : action === "reject" ? (
              <X className="size-4" aria-hidden />
            ) : (
              <Check className="size-4" aria-hidden />
            )}
            {t(CONFIRM_LABEL[action])}
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
            {t(DONE_LABEL[action])}
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
