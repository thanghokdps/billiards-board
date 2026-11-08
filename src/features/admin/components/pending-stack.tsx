"use client";

import { MotionConfig } from "motion/react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import type { PlayerRef } from "@/server/matches/schema";
import type { SubmissionView } from "@/server/submissions/schema";

import { PendingSlip } from "./pending-slip";
import type { AdminPlayer } from "../types";

const TILTS = [-0.6, 0.5, -0.3, 0.7];

/** Matches viewers sent in: a stack of score slips on the felt, newest first, with how many wait. */
export function PendingStack({
  pending,
  now,
  players,
}: {
  pending: SubmissionView[];
  now: string;
  players: AdminPlayer[];
}) {
  const t = useTranslations("admin.pending");
  const roster: PlayerRef[] = players
    .filter((p) => p.active)
    .map(({ id, slug, name, nickname, ballColor, ballNumber, avatarUrl, guest }) => ({
      id,
      slug,
      name,
      nickname,
      ballColor,
      ballNumber,
      avatarUrl,
      guest,
    }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <Badge
          tone={pending.length > 0 ? "lamp" : "neutral"}
          size="md"
          aria-label={t("count", { count: pending.length })}
        >
          <span className="digits">{pending.length}</span>
        </Badge>
      </CardHeader>
      <CardBody>
        {pending.length === 0 ? (
          <EmptyState title={t("empty.title")} body={t("empty.body")} />
        ) : (
          <MotionConfig reducedMotion="user">
            <ul className="felt space-y-4 rounded-lg p-3 sm:p-4">
              {pending.map((submission, i) => (
                <PendingSlip
                  key={submission.id}
                  submission={submission}
                  now={now}
                  tilt={TILTS[i % TILTS.length]!}
                  roster={roster}
                />
              ))}
            </ul>
          </MotionConfig>
        )}
      </CardBody>
    </Card>
  );
}
