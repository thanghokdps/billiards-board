"use client";

import { Check, PenLine, X } from "lucide-react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchRow } from "@/components/ui/match-row";
import { formatRelative } from "@/features/audit";
import { cn } from "@/lib/cn";
import type { PlayerRef } from "@/server/matches/schema";
import type { SubmissionView } from "@/server/submissions/schema";

import { PendingEdit } from "./pending-edit";
import { useSlipDecision } from "../hooks/use-slip-decision";
import { slipMatch } from "../lib/slip-match";

interface PendingSlipProps {
  submission: SubmissionView;
  /** Server time, so the relative text reads the same on the server and in the browser. */
  now: string;
  /** A small resting angle, so a stack of slips does not look like a table. */
  tilt: number;
  /** Who the Edit scene can seat. */
  roster: PlayerRef[];
}

const DROP = { rotateX: 90, y: 90, opacity: 0 };

/** One viewer-submitted match as a score slip: the match, who sent it, and the two decisions. */
export function PendingSlip({ submission, now, tilt, roster }: PendingSlipProps) {
  const t = useTranslations("admin.pending");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const { phase, error, approve, reject } = useSlipDecision(submission.id);
  const { match, newGuests } = slipMatch(submission);
  const busy = phase !== "idle";

  return (
    <motion.li
      layout="position"
      animate={phase === "rejected" ? DROP : { rotateX: 0, y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.5, 0, 0.75, 0] }}
      style={{ rotate: tilt, transformPerspective: 700 }}
      className="relative origin-top rounded-md border border-line-strong bg-surface px-4 pb-4 shadow-pop"
    >
      <div aria-hidden className="-mx-4 mb-1 h-1.5 rounded-t-md bg-lamp/70" />
      <MatchRow match={match} />
      {newGuests.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-ivory-muted">
          <Badge tone="lamp" className="border border-dashed border-chalk text-chalk">
            {t("newGuest")}
          </Badge>
          {newGuests.join(", ")}
        </p>
      )}
      <p className="mt-2 text-xs text-ivory-faint">
        {t("sentBy", { name: submission.submitter ?? t("anonymous") })} ·{" "}
        <time dateTime={submission.createdAt}>{formatRelative(submission.createdAt, now, locale)}</time>
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-md border border-loss/50 bg-loss/10 px-3 py-2 text-sm text-loss">
          {t(`errors.${error}`)}
        </p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button variant="outline" disabled={busy} aria-busy={phase === "sending"} onClick={reject}>
          <X className="size-4" aria-hidden />
          {t("reject")}
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => setEditing(true)}>
          <PenLine className="size-4" aria-hidden />
          {t("edit")}
        </Button>
        <Button disabled={busy} aria-busy={phase === "sending"} onClick={approve}>
          <Check className="size-4" aria-hidden />
          {t("approve")}
        </Button>
      </div>
      {phase === "approved" && (
        <motion.p
          role="status"
          initial={{ scale: 2.4, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: -8 }}
          transition={{ type: "spring", stiffness: 420, damping: 16 }}
          className={cn(
            "pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "rounded-md border-4 border-double border-win bg-night/80 px-5 py-2 font-display text-3xl font-bold tracking-wide text-win uppercase",
          )}
        >
          {t("stamp")}
        </motion.p>
      )}
      {editing && <PendingEdit submission={submission} roster={roster} onClose={() => setEditing(false)} />}
    </motion.li>
  );
}
