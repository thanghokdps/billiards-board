"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";

import { Ball } from "@/components/ui/ball";
import { formatCompactVnd, formatVnd } from "@/lib/domain";
import { clack, haptic } from "@/lib/feedback";
import { prefersReducedMotion } from "@/lib/motion";
import type { MoneyBreakdown } from "@/lib/stats";

const MAX_CHIPS = 22;
const MAX_TOWERS = 5;
const ORBIT_DEG = 14;

/** Who paid most, as chip towers in each player's colour. The legend carries the names, amounts and the replay. */
export function ChipTowers({ byPlayer }: { byPlayer: MoneyBreakdown["byPlayer"] }) {
  const t = useTranslations("money");
  const locale = useLocale();
  const floor = useRef<HTMLDivElement>(null);
  const [drops, setDrops] = useState<Record<number, number>>({});
  const payers = byPlayer.filter((p) => p.paid > 0).slice(0, MAX_TOWERS);
  const max = payers[0]?.paid ?? 0;

  const orbit = (event: PointerEvent<HTMLDivElement>) => {
    const el = floor.current;
    if (!el || prefersReducedMotion()) return;
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    el.style.setProperty("--tilt-x", `${((0.5 - (event.clientY - top) / height) * ORBIT_DEG).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${((0.5 - (event.clientX - left) / width) * ORBIT_DEG * 2).toFixed(2)}deg`);
  };
  const settle = () => {
    floor.current?.style.setProperty("--tilt-x", "0deg");
    floor.current?.style.setProperty("--tilt-y", "0deg");
  };
  const replay = (id: number) => {
    clack(0.3);
    haptic();
    setDrops((all) => ({ ...all, [id]: (all[id] ?? 0) + 1 }));
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div aria-hidden className="chip-scene" onPointerMove={orbit} onPointerLeave={settle}>
        <div ref={floor} className="chip-floor">
          {payers.map(({ player, paid }, tower) => (
            // A new key remounts the tower, which replays the drop.
            <div
              key={`${player.id}-${drops[player.id] ?? 0}`}
              className="chip-tower"
              style={{ ["--chip" as string]: player.ballColor, ["--t" as string]: tower } as CSSProperties}
            >
              {Array.from({ length: Math.max(2, Math.round((paid / max) * MAX_CHIPS)) }, (_, n) => (
                <span key={n} className="chip" style={{ ["--n" as string]: n } as CSSProperties} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <ul className="grid auto-cols-fr grid-flow-col gap-1">
        {payers.map(({ player, paid }) => (
          <li key={player.id} className="min-w-0">
            <button
              type="button"
              onClick={() => replay(player.id)}
              aria-label={t("chipsReplay", { name: player.name, amount: formatVnd(paid, locale) })}
              className="press flex w-full flex-col items-center gap-0.5 rounded-md py-1 hover:bg-night/30"
            >
              <Ball color={player.ballColor} number={player.ballNumber} className="ball-roll size-6" />
              <span className="w-full truncate text-center text-2xs font-semibold">{player.name}</span>
              <span className="digits text-sm font-bold text-lamp">{formatCompactVnd(paid, locale)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
