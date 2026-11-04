import { useTranslations } from "next-intl";

import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import type { PlayerRef } from "@/server/matches/schema";

interface PredictionSideProps {
  players: PlayerRef[];
  voters: PlayerRef[];
  won: boolean;
  align: "left" | "right";
}

/** One side of a prediction: who plays, the LED vote tally, and who picked it. */
export function PredictionSide({ players, voters, won, align }: PredictionSideProps) {
  const t = useTranslations("predictions.card");
  const right = align === "right";
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", right && "items-end text-right")}>
      <div className={cn("flex", right ? "flex-row-reverse -space-x-reverse" : "", "-space-x-2")}>
        {players.map((p) => (
          <PlayerAvatar key={p.id} player={p} size="md" />
        ))}
      </div>
      <p className={cn("max-w-full truncate font-bold leading-tight", won ? "text-ivory" : "text-ivory-muted")}>
        {players.map((p) => p.name).join(" & ")}
      </p>
      <p className={cn("digits text-score font-bold leading-none", won ? "text-lamp digits-glow" : "text-ivory")}>
        {voters.length}
        <span className="ml-1.5 text-2xs font-semibold uppercase tracking-label text-ivory-faint">
          {t("votes", { count: voters.length })}
        </span>
      </p>
      {won && <p className="font-display text-xs font-bold uppercase tracking-label text-lamp">★ {t("winner")}</p>}
      {voters.length > 0 && (
        <ul aria-label={t("voters")} className={cn("flex flex-wrap gap-1", right && "justify-end")}>
          {voters.map((v) => (
            <li
              key={v.id}
              className="inline-flex items-center gap-1 rounded-full bg-surface-3 py-0.5 pl-0.5 pr-2 text-2xs font-semibold"
            >
              <PlayerAvatar player={v} size="xs" />
              {v.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
