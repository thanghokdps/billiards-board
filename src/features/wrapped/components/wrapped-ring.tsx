"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";

import { Ball } from "@/components/ui/ball";
import { HoloFrame } from "@/components/ui/holo-frame";
import { Link } from "@/i18n/navigation";
import { formatPercent } from "@/lib/domain";
import { clack } from "@/lib/feedback";
import { prefersReducedMotion } from "@/lib/motion";
import type { StatPlayer } from "@/lib/stats";

interface RingEntry {
  player: StatPlayer;
  played: number;
  winRate: number;
}

const CARD_REM = 12.5;
const GAP_REM = 1.25;
/** Two cards cannot make a ring; they stay flat. */
const MIN_RING = 3;
const DRAG_PX_PER_CARD = 200;
const TAP_SLOP_PX = 6;

const wrap = (index: number, count: number) => ((index % count) + count) % count;

/** Every player's card standing in a ring. Drag or use the arrows to turn it; the card in front opens that story. */
export function WrappedRing({ entries, year }: { entries: RingEntry[]; year: number }) {
  const t = useTranslations("wrapped");
  const common = useTranslations("common");
  const locale = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLUListElement>(null);
  const drag = useRef<{ startX: number; moved: boolean } | null>(null);
  const [turn, setTurn] = useState(0);
  const [dragging, setDragging] = useState(false);
  const count = entries.length;
  const front = wrap(turn, count);
  const flat = count < MIN_RING || undefined;
  const radius = CARD_REM / 2 / Math.tan(Math.PI / count) + GAP_REM;

  const spinTo = (next: number) => {
    if (next === turn) return;
    clack(0.2);
    setTurn(next);
  };

  /** Shortest way round to a card, so focusing a neighbour never spins the whole ring backwards. */
  const nearestTurn = (index: number) => {
    const ahead = wrap(index - turn, count);
    return turn + (ahead > count / 2 ? ahead - count : ahead);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (flat || prefersReducedMotion()) return;
    drag.current = { startX: event.clientX, moved: false };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const held = drag.current;
    if (!held) return;
    const dx = event.clientX - held.startX;
    if (!held.moved && Math.abs(dx) < TAP_SLOP_PX) return;
    if (!held.moved) {
      held.moved = true;
      setDragging(true);
      stageRef.current?.setPointerCapture(event.pointerId);
    }
    ringRef.current?.style.setProperty("--turn", String(turn - dx / DRAG_PX_PER_CARD));
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const held = drag.current;
    if (!held?.moved) {
      drag.current = null;
      return;
    }
    setDragging(false);
    ringRef.current?.style.setProperty("--turn", String(turn));
    spinTo(Math.round(turn - (event.clientX - held.startX) / DRAG_PX_PER_CARD));
    // The click that ends a drag still has to find `moved` set, so it clears on the next tick.
    setTimeout(() => (drag.current = null));
  };

  const onCardClick = (event: MouseEvent, index: number) => {
    if (flat || prefersReducedMotion()) return;
    if (drag.current?.moved) {
      event.preventDefault();
    } else if (index !== front) {
      event.preventDefault();
      spinTo(nearestTurn(index));
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (flat) return;
    if (event.key === "ArrowLeft") spinTo(turn - 1);
    if (event.key === "ArrowRight") spinTo(turn + 1);
  };

  return (
    <div className="space-y-3">
      <div
        ref={stageRef}
        className="wrapped-ring-stage"
        data-dragging={dragging || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
      >
        <ul
          ref={ringRef}
          className="wrapped-ring"
          data-flat={flat}
          style={
            {
              ["--turn" as string]: turn,
              ["--step" as string]: `${360 / count}deg`,
              ["--radius" as string]: `${radius.toFixed(2)}rem`,
            } as CSSProperties
          }
        >
          {entries.map(({ player, played, winRate }, index) => (
            <li
              key={player.id}
              data-active={index === front || undefined}
              style={{ ["--i" as string]: index } as CSSProperties}
            >
              <Link
                href={`/wrapped/${player.slug}?year=${year}`}
                aria-label={t("index.open", { name: player.name, year })}
                draggable={false}
                onClick={(event) => onCardClick(event, index)}
                onFocus={() => {
                  if (!flat && !prefersReducedMotion()) spinTo(nearestTurn(index));
                }}
                className="block h-full rounded-xl"
              >
                <HoloFrame rounded="rounded-xl">
                  <div className="wrapped-card" style={{ ["--player" as string]: player.ballColor } as CSSProperties}>
                    <Ball
                      color={player.ballColor}
                      number={player.ballNumber}
                      className="ball-roll mb-2 size-24 drop-shadow-xl"
                    />
                    <p className="w-full truncate font-display text-3xl font-bold">{player.name}</p>
                    {player.nickname && <p className="w-full truncate text-xs text-ivory-muted">{player.nickname}</p>}
                    <p className="mt-1 text-sm text-ivory-muted">
                      {t("index.card", {
                        matches: common("matches", { count: played }),
                        winRate: formatPercent(winRate, locale),
                      })}
                    </p>
                  </div>
                </HoloFrame>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="wrapped-ring-nav items-center justify-center gap-3" data-flat={flat}>
        <button
          type="button"
          aria-label={t("index.prev")}
          onClick={() => spinTo(turn - 1)}
          className="press flex size-11 cursor-pointer items-center justify-center rounded-full bg-surface-2 hover:text-lamp"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={t("index.next")}
          onClick={() => spinTo(turn + 1)}
          className="press flex size-11 cursor-pointer items-center justify-center rounded-full bg-surface-2 hover:text-lamp"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
