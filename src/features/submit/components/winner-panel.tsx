import { Crown } from "lucide-react";
import { useTranslations } from "next-intl";

import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import { clack, haptic } from "@/lib/feedback";
import type { PlayerRef } from "@/server/matches/schema";

import { IssueNote } from "./issue-note";
import { loserSeats, sideOfSeat, type Draft } from "../lib/draft";
import type { StepIssue } from "../lib/issues";

interface WinnerPanelProps {
  draft: Draft;
  seated: (PlayerRef | null)[];
  issues: StepIssue[];
  disabled: boolean;
  onPickSeat: (seat: number) => void;
}

/** The keyboard path for step 3: the same choice as tapping a ball on the table, one button per side (or per player). */
export function WinnerPanel({ draft, seated, issues, disabled, onPickSeat }: WinnerPanelProps) {
  const t = useTranslations("submit.winner");
  const threeWay = draft.format === "1v1v1";
  const losers = loserSeats(draft);
  const options = threeWay
    ? seated.map((p, seat) => ({ seat, players: [p], picked: losers.includes(seat) }))
    : (["a", "b"] as const).map((side) => {
        const seats = seated.flatMap((_, seat) => (sideOfSeat(draft.format, seat) === side ? [seat] : []));
        return {
          seat: seats[0]!,
          players: seats.map((s) => seated[s]),
          picked: !!draft.result && !losers.includes(seats[0]!),
        };
      });

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-ivory-muted">{t(threeWay ? "hintLoser" : "hintSide")}</p>
      <IssueNote step="winner" issues={issues} />
      <div role="group" aria-label={t("title")} className="grid gap-2">
        {options.map(({ seat, players, picked }) => {
          const names = players.map((p) => p?.name ?? "").join(" & ");
          return (
            <button
              key={seat}
              type="button"
              aria-pressed={picked}
              disabled={disabled}
              onClick={() => {
                clack(0.4);
                haptic();
                onPickSeat(seat);
              }}
              className={cn(
                "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2 text-left transition-colors active:scale-[0.98] disabled:opacity-50",
                picked
                  ? "border-lamp bg-lamp/10 shadow-lamp"
                  : "border-line-strong bg-surface-2 hover:border-ivory-faint",
              )}
            >
              <span className="flex shrink-0 -space-x-2">
                {players.map((p) => p && <PlayerAvatar key={p.id} player={p} size="sm" />)}
              </span>
              <span className="min-w-0 flex-1 truncate font-semibold">{t(threeWay ? "loses" : "wins", { names })}</span>
              {picked && !threeWay && <Crown className="size-5 shrink-0 text-lamp" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
