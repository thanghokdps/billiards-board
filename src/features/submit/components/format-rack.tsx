import { useTranslations } from "next-intl";

import { Ball } from "@/components/ui/ball";
import { cn } from "@/lib/cn";
import { PAIRING_FORMATS, PLAYERS_IN_FORMAT, type PairingFormat } from "@/lib/domain";

/** Each format as the balls it racks, in % of the picture: a pair, a diamond, a triangle. */
const RACKS: Record<PairingFormat, [number, number][]> = {
  "1v1": [
    [28, 50],
    [72, 50],
  ],
  "2v2": [
    [50, 16],
    [20, 50],
    [80, 50],
    [50, 84],
  ],
  "1v1v1": [
    [50, 20],
    [26, 76],
    [74, 76],
  ],
};
const BALL_COLORS = [
  "var(--color-pool-yellow)",
  "var(--color-pool-blue)",
  "var(--color-pool-red)",
  "var(--color-pool-purple)",
];

interface FormatRackProps {
  value: PairingFormat;
  disabled: boolean;
  onChange: (format: PairingFormat) => void;
}

/** The format is picked by tapping the rack it makes. */
export function FormatRack({ value, disabled, onChange }: FormatRackProps) {
  const t = useTranslations("submit.game");
  return (
    <div role="group" aria-label={t("format")} className="grid grid-cols-3 gap-2">
      {PAIRING_FORMATS.map((format) => (
        <button
          key={format}
          type="button"
          aria-pressed={value === format}
          disabled={disabled}
          onClick={() => onChange(format)}
          className={cn(
            "flex min-h-28 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 px-1 py-2 transition-colors active:scale-[0.97] disabled:opacity-50",
            value === format
              ? "border-lamp bg-lamp/10 shadow-lamp"
              : "border-line-strong bg-surface-2 hover:border-ivory-faint",
          )}
        >
          <span aria-hidden className="relative block size-16">
            {RACKS[format].map(([x, y], i) => (
              <span
                key={i}
                className="absolute -mt-3 -ml-3 size-6 drop-shadow-md"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <Ball color={BALL_COLORS[i]} number="" className="size-full" />
              </span>
            ))}
          </span>
          <span className="font-display text-xl leading-none font-bold">{format}</span>
          <span className="text-2xs text-ivory-muted">{t("players", { count: PLAYERS_IN_FORMAT[format] })}</span>
        </button>
      ))}
    </div>
  );
}
