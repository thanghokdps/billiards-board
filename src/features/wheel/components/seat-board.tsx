"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";

import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import type { PlayerRef } from "@/server/matches/schema";

const POP = { type: "spring", stiffness: 420, damping: 18 } as const;

function Seat({ player, label }: { player: PlayerRef | undefined; label: string }) {
  if (!player) {
    return (
      <span className="flex min-w-0 flex-col items-center gap-1 text-ivory-faint">
        <span aria-hidden className="size-12 rounded-full border-2 border-dashed border-line-strong" />
        <span className="max-w-full truncate text-2xs">{label}</span>
      </span>
    );
  }
  return (
    <motion.span
      initial={{ scale: 0, rotate: -160, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={POP}
      className="flex min-w-0 flex-col items-center gap-1"
    >
      <PlayerAvatar player={player} size="md" />
      <span className="max-w-full truncate text-sm font-bold">{player.name}</span>
    </motion.span>
  );
}

function Versus({ done }: { done: boolean }) {
  return (
    <motion.span
      key={String(done)}
      initial={done ? { scale: 3, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={POP}
      className={cn("font-display text-2xl font-bold", done ? "text-lamp digits-glow" : "text-ivory-faint")}
    >
      VS
    </motion.span>
  );
}

interface SeatBoardProps {
  /** One list per side, one player per seat filled so far. */
  sides: PlayerRef[][];
  seatsPerSide: number;
  done: boolean;
}

/** The match taking shape: empty seats from the start, each pick drops into its seat, and VS lands on the last one. */
export function SeatBoard({ sides, seatsPerSide, done }: SeatBoardProps) {
  const t = useTranslations("wheel");
  return (
    <div
      aria-live="polite"
      aria-label={t("boardTitle")}
      role="group"
      className={cn(
        "flex items-center justify-center gap-3 rounded-lg border border-line bg-surface-2 p-3 transition-shadow duration-500",
        done && "shadow-lamp",
      )}
    >
      {sides.map((side, i) => (
        <Fragment key={i}>
          {i > 0 && <Versus done={done} />}
          <div className="flex min-w-0 flex-1 justify-center gap-2">
            {Array.from({ length: seatsPerSide }, (_, seat) => (
              <Seat key={side[seat]?.id ?? `empty-${seat}`} player={side[seat]} label={t("seatEmpty")} />
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
