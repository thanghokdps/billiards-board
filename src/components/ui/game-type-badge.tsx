import { cn } from "@/lib/cn";
import { GAME_LABEL, type GameType } from "@/lib/domain";

const TONE: Record<GameType, string> = {
  "3c_real": "border-felt-bright/50 text-win",
  "3c_fake": "border-cold/40 text-cold",
  libre: "border-lamp/40 text-lamp",
};

/** Game type names are proper names: identical in both languages. */
export function GameTypeBadge({ gameType, className }: { gameType: GameType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-display text-2xs font-bold uppercase tracking-wider",
        TONE[gameType],
        className,
      )}
    >
      {GAME_LABEL[gameType]}
    </span>
  );
}
