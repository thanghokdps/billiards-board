import type { ComponentProps } from "react";

import type { MatchRow } from "@/components/ui/match-row";
import { GUEST_SEAT } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";
import type { SeatView, SubmissionView } from "@/server/submissions/schema";

type SlipMatch = ComponentProps<typeof MatchRow>["match"];

/** A guest the submitter typed has no row yet: a negative id keeps it apart from every real player. */
function seatRef(seat: SeatView, index: number): PlayerRef {
  if (!("isNew" in seat)) return seat;
  return { ...GUEST_SEAT, id: -(index + 1), slug: `new-${index}`, name: seat.name };
}

/** A pending submission in the shape `MatchRow` draws, plus the names of the guests approving would create. */
export function slipMatch(sub: SubmissionView): { match: SlipMatch; newGuests: string[] } {
  const seats = [...sub.sideA, ...sub.sideB];
  const refs = seats.map(seatRef);
  const sideA = refs.slice(0, sub.sideA.length);
  const scores = sub.scores?.map((score, i) => ({ playerId: refs[i]!.id, score })) ?? [];
  return {
    match: {
      gameType: sub.gameType,
      format: sub.format,
      sideA,
      sideB: refs.slice(sub.sideA.length),
      winnerSide: sub.winnerSide,
      scoreA: sub.scoreA,
      scoreB: sub.scoreB,
      scores,
      bill: sub.bill,
      tags: [],
      note: sub.note,
    },
    newGuests: seats.flatMap((seat) => ("isNew" in seat ? [seat.name] : [])),
  };
}
