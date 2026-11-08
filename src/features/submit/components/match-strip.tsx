import { Crown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { GameTypeBadge } from "@/components/ui/game-type-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatVnd } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";

import type { Draft } from "../lib/draft";

function Side({ players, won }: { players: PlayerRef[]; won: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <span className="relative flex -space-x-2">
        {players.map((p) => (
          <PlayerAvatar key={p.id} player={p} size="md" />
        ))}
        {won && <Crown aria-hidden className="absolute -top-3 left-1/2 size-4 -translate-x-1/2 fill-lamp text-lamp" />}
      </span>
      <span className="max-w-full truncate text-sm font-bold">{players.map((p) => p.name).join(" & ")}</span>
    </div>
  );
}

/** The match so far on one line: sides, who won, the score and the bill. */
export function MatchStrip({ draft, sides }: { draft: Draft; sides: { sideA: PlayerRef[]; sideB: PlayerRef[] } }) {
  const t = useTranslations("submit.strip");
  const locale = useLocale();
  const threeWay = draft.format === "1v1v1";
  const scored = threeWay ? draft.scores.some((s) => s !== null) : draft.scoreA !== null || draft.scoreB !== null;
  return (
    <div className="space-y-2 rounded-lg border border-line bg-surface-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <GameTypeBadge gameType={draft.gameType} />
        <span className="flex items-center gap-2 text-xs text-ivory-muted">
          {scored && (
            <span className="digits text-sm font-bold text-lamp">
              {threeWay ? draft.scores.map((s) => s ?? 0).join(" · ") : `${draft.scoreA ?? 0}-${draft.scoreB ?? 0}`}
            </span>
          )}
          {draft.bill !== null && <span>{formatVnd(draft.bill, locale)}</span>}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Side
          players={sides.sideA}
          won={!threeWay && draft.result !== null && "side" in draft.result && draft.result.side === "a"}
        />
        <span className="font-display text-xl font-bold text-ivory-faint">{t("vs")}</span>
        <Side
          players={sides.sideB}
          won={!threeWay && draft.result !== null && "side" in draft.result && draft.result.side === "b"}
        />
      </div>
      {threeWay && (
        <p className="text-center text-xs text-ivory-muted">{t("loserPays", { name: sides.sideB[0]?.name ?? "" })}</p>
      )}
    </div>
  );
}
