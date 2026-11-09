import { useMemo, useState } from "react";

import type { GameType, PairingFormat } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";

import {
  MAX_BILL,
  MAX_SCORE,
  makeNewGuest,
  removeGuest,
  seatPlayer,
  sideOfSeat,
  unseat,
  withFormat,
  type Draft,
  type ScoreTarget,
} from "../lib/draft";

const bump = (value: number | null, delta: 1 | -1): number | null => {
  if (value === null) return delta > 0 ? 1 : null;
  const next = value + delta;
  return next < 0 ? null : Math.min(MAX_SCORE, next);
};

/** The draft of one match and every way the scene changes it. Each setter takes the latest draft, so a held button never reads a stale one. */
export function useDraft(roster: PlayerRef[], initial: Draft, blank: Draft) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [target, setTarget] = useState<number | null>(null);
  const people = useMemo(() => [...roster, ...draft.newGuests], [roster, draft.newGuests]);
  const patch = (changes: Partial<Draft>) => setDraft((d) => ({ ...d, ...changes }));

  return {
    draft,
    people,
    target,
    setTarget,
    setGame: (gameType: GameType) => patch({ gameType }),
    setFormat: (format: PairingFormat) => {
      setDraft((d) => withFormat(d, format));
      setTarget(null);
    },
    sit: (id: number) => {
      setDraft((d) => seatPlayer(d, id, target));
      setTarget(null);
    },
    unseat: (seat: number) => setDraft((d) => unseat(d, seat)),
    addGuest: (name: string) => {
      setDraft((d) => {
        const guest = makeNewGuest(name, [...roster, ...d.newGuests]);
        return seatPlayer({ ...d, newGuests: [...d.newGuests, guest] }, guest.id, target);
      });
      setTarget(null);
    },
    removeGuest: (id: number) => setDraft((d) => removeGuest(d, id)),
    /** A ball tapped on the table, or its button: that side wins, or in a 1v1v1 that player loses. */
    pickSeat: (seat: number) =>
      setDraft((d) => {
        const side = sideOfSeat(d.format, seat);
        return { ...d, result: side ? { side } : { loser: seat } };
      }),
    stepScore: (to: ScoreTarget, delta: 1 | -1) =>
      setDraft((d) => {
        if (to === "a") return { ...d, scoreA: bump(d.scoreA, delta) };
        if (to === "b") return { ...d, scoreB: bump(d.scoreB, delta) };
        return { ...d, scores: d.scores.map((s, i) => (i === to ? bump(s, delta) : s)) };
      }),
    addBill: (amount: number) => setDraft((d) => ({ ...d, bill: Math.min(MAX_BILL, (d.bill ?? 0) + amount) })),
    setBill: (bill: number | null) => patch({ bill }),
    setNote: (note: string) => patch({ note }),
    reset: () => {
      setDraft(blank);
      setTarget(null);
    },
  };
}
