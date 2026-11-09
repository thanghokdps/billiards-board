import { useTranslations } from "next-intl";

import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";
import { GAME_LABEL, GAME_TYPES, type GameType, type PairingFormat } from "@/lib/domain";
import { clack, haptic } from "@/lib/feedback";

import { FormatRack } from "./format-rack";

interface GameStepProps {
  gameType: GameType;
  format: PairingFormat;
  disabled: boolean;
  onGame: (game: GameType) => void;
  onFormat: (format: PairingFormat) => void;
}

/** Step 1: the game on felt-coloured chips, the format on the rack it makes. */
export function GameStep({ gameType, format, disabled, onGame, onFormat }: GameStepProps) {
  const t = useTranslations("submit.game");
  return (
    <div className="space-y-4">
      <div role="group" aria-label={t("title")} className="flex flex-wrap gap-2">
        {GAME_TYPES.map((game) => (
          <Chip
            key={game}
            selected={game === gameType}
            disabled={disabled}
            onClick={() => {
              clack(0.3);
              haptic();
              onGame(game);
            }}
            className={cn(
              "h-11 px-5",
              game !== gameType &&
                "border-felt-bright/60 bg-felt text-ivory hover:border-ivory-faint hover:bg-felt-bright",
            )}
          >
            {GAME_LABEL[game]}
          </Chip>
        ))}
      </div>
      <FormatRack
        value={format}
        disabled={disabled}
        onChange={(next) => {
          clack(0.3);
          haptic();
          onFormat(next);
        }}
      />
      <p className="text-sm text-ivory-muted">{t("hint")}</p>
    </div>
  );
}
