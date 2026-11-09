import type { PairingFormat } from "@/lib/domain";
import type { Point } from "@/lib/table-3d/table-scene";
import type { PlayerRef } from "@/server/matches/schema";

import { loserSeats, type Draft } from "./draft";

export type TableMode = "seats" | "winner" | "send";

/** Seats in % of the tall felt: side A up top, side B at the bottom, a 1v1v1 as a triangle. */
export const SEAT_POINTS: Record<PairingFormat, Point[]> = {
  "1v1": [
    { x: 50, y: 13 },
    { x: 50, y: 87 },
  ],
  "2v2": [
    { x: 30, y: 13 },
    { x: 70, y: 13 },
    { x: 30, y: 87 },
    { x: 70, y: 87 },
  ],
  "1v1v1": [
    { x: 50, y: 13 },
    { x: 28, y: 87 },
    { x: 72, y: 87 },
  ],
};

/** The cue ball crosses the empty middle of the felt, clear of every seat. */
export const CUE_PATH = { start: { x: 12, y: 66 }, hit: { x: 46, y: 50 }, rest: { x: 80, y: 34 } };

const PER_ROW = 5;
const COLUMN_GAP = 19;

/** A resting place on the bench band between the seats, by the person's slot: five to a row, rows centred. */
export function benchPoint(slot: number, count: number): Point {
  const rows = Math.ceil(count / PER_ROW);
  const row = Math.floor(slot / PER_ROW);
  const inRow = Math.min(PER_ROW, count - row * PER_ROW);
  const pitch = rows > 3 ? 14 : 17;
  return {
    x: 50 + ((slot % PER_ROW) - (inRow - 1) / 2) * COLUMN_GAP,
    y: 50 + (row - (rows - 1) / 2) * pitch,
  };
}

/** The pocket nearest a seat: the corner on its side of the felt. */
export const pocketOf = ({ x, y }: Point): Point => ({ x: x < 50 ? 0 : 100, y: y < 50 ? 0 : 100 });

export interface PlacedBall {
  person: PlayerRef;
  point: Point;
  /** The seat it sits on, or null while it waits on the bench. */
  seat: number | null;
  /** On its way to a pocket (or in it): this ball lost. */
  potted: boolean;
  /** On the winners' side once the result is in. */
  won: boolean;
  delayMs: number;
}

/**
 * Where every ball rests. The bench shows only while seating; after that only seated players stay, and the losers
 * head for a pocket once the winner is picked.
 */
export function placeBalls(
  draft: Pick<Draft, "seats" | "format" | "result">,
  people: PlayerRef[],
  mode: TableMode,
): PlacedBall[] {
  const points = SEAT_POINTS[draft.format];
  const losers = mode === "seats" ? [] : loserSeats(draft);
  return people.flatMap((person, slot): PlacedBall[] => {
    const seat = draft.seats.indexOf(person.id);
    const delayMs = slot * 40;
    if (seat >= 0) {
      const potted = losers.includes(seat);
      const spot = points[seat]!;
      return [
        {
          person,
          point: potted ? pocketOf(spot) : spot,
          seat,
          potted,
          won: !!draft.result && mode !== "seats" && !potted,
          delayMs,
        },
      ];
    }
    if (mode !== "seats") return [];
    return [{ person, point: benchPoint(slot, people.length), seat: null, potted: false, won: false, delayMs }];
  });
}
