"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import type { PlayerRef } from "@/server/matches/schema";

import { CueStrike } from "./cue-strike";
import { SeatBall } from "./seat-ball";
import { SeatCanvas, type SeatSceneBall } from "./seat-canvas";
import { SeatSlot } from "./seat-slot";
import { TableFelt } from "./table-felt";
import { sideOfSeat, type Draft } from "../lib/draft";
import { placeBalls, SEAT_POINTS, type TableMode } from "../lib/table-balls";

/** A losing ball rolls for at most this long (its stagger plus the 900 ms roll) before it drops out of the scene. */
const POT_SETTLE_MS = 1500;

interface SeatTableProps {
  draft: Draft;
  people: PlayerRef[];
  mode: TableMode;
  /** The seat the next ball rolls to, when the player chose one. */
  target: number | null;
  flaggedSeats: number[];
  strike: number;
  sending: boolean;
  disabled: boolean;
  onBench: (id: number) => void;
  onUnseat: (seat: number) => void;
  onTarget: (seat: number) => void;
  onPickSeat: (seat: number) => void;
}

/** Side labels are pinned to the felt like the balls, so they follow the 3D perspective. */
function SideLabel({ at, live, children }: { at: { x: number; y: number }; live: boolean; children: string }) {
  return (
    <span
      aria-hidden
      data-pocket
      data-tall={`${at.x},${at.y}`}
      className={cn(
        "pointer-events-none absolute z-10 size-0",
        live ? "top-0 left-0 translate-x-(--scene-x) translate-y-(--scene-y)" : "top-(--y) left-(--x)",
      )}
      style={{ ["--x" as string]: `${at.x}%`, ["--y" as string]: `${at.y}%` }}
    >
      <span className="absolute -translate-x-1/2 -translate-y-1/2 text-2xs font-semibold tracking-wide whitespace-nowrap text-ivory-muted uppercase [text-shadow:0_1px_2px_rgb(0_0_0/0.8)]">
        {children}
      </span>
    </span>
  );
}

/** The scene of steps 2, 3 and 6: players are balls on a top-down table, seated by tapping and potted when they lose. */
export function SeatTable(props: SeatTableProps) {
  const { draft, people, mode, target, flaggedSeats, strike, sending, disabled } = props;
  const t = useTranslations("submit.table");
  const [live, setLive] = useState(false);
  const { seats, format, result } = draft;
  const placed = useMemo(
    () => placeBalls({ seats, format, result }, people, mode),
    [seats, format, result, people, mode],
  );
  const pottedKey = placed
    .filter((b) => b.potted)
    .map((b) => b.person.id)
    .join(",");
  const [settledKey, setSettledKey] = useState("");
  const settled = pottedKey !== "" && settledKey === pottedKey;

  useEffect(() => {
    if (!pottedKey) return;
    const id = setTimeout(() => setSettledKey(pottedKey), POT_SETTLE_MS);
    return () => clearTimeout(id);
  }, [pottedKey]);

  const sceneBalls = useMemo<SeatSceneBall[]>(
    () =>
      placed
        .filter((b) => !(b.potted && settled))
        .map(({ person, point, delayMs }) => ({
          id: person.id,
          color: person.ballColor,
          number: person.ballNumber,
          guest: person.guest,
          point,
          delayMs,
        })),
    [placed, settled],
  );

  const points = SEAT_POINTS[format];
  const threeWay = format === "1v1v1";
  const labelFor = (seat: number | null, name: string): string => {
    if (mode === "send") return name;
    if (mode === "winner") return t(threeWay ? "loses" : "wins", { name });
    return t(seat === null ? "sit" : "back", { name });
  };
  const markOf = (seat: number) => (threeWay ? String(seat + 1) : (sideOfSeat(format, seat)?.toUpperCase() ?? ""));

  return (
    <div className="mx-auto w-full max-w-sm">
      <TableFelt live={live}>
        <SeatCanvas balls={sceneBalls} strike={strike} live={live} onLiveChange={setLive} />
        {!threeWay && (
          <>
            <SideLabel at={{ x: 50, y: 3 }} live={live}>
              {t("sideA")}
            </SideLabel>
            <SideLabel at={{ x: 50, y: 97 }} live={live}>
              {t("sideB")}
            </SideLabel>
          </>
        )}
        {mode === "seats" &&
          seats.map((id, seat) =>
            id === null ? (
              <SeatSlot
                key={`slot-${seat}`}
                point={points[seat]!}
                label={t("seat", { mark: markOf(seat) })}
                mark={markOf(seat)}
                targeted={target === seat}
                flagged={flaggedSeats.includes(seat)}
                live={live}
                disabled={disabled}
                onPick={() => props.onTarget(seat)}
              />
            ) : null,
          )}
        {placed.map((ball) => (
          <SeatBall
            key={ball.person.id}
            ball={ball}
            label={labelFor(ball.seat, ball.person.name)}
            live={live}
            gone={ball.potted && settled}
            disabled={disabled || mode === "send" || (mode === "winner" && ball.potted)}
            flagged={ball.seat !== null && flaggedSeats.includes(ball.seat)}
            onPick={() => {
              if (mode === "seats")
                return ball.seat === null ? props.onBench(ball.person.id) : props.onUnseat(ball.seat);
              if (ball.seat !== null) props.onPickSeat(ball.seat);
            }}
          />
        ))}
        {sending && <CueStrike strike={strike} live={live} />}
      </TableFelt>
    </div>
  );
}
