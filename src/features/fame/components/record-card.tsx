import type { LucideIcon } from "lucide-react";

import { HoloFrame } from "@/components/ui/holo-frame";
import { MatchRow } from "@/components/ui/match-row";
import { RollingNumber } from "@/components/ui/rolling-number";
import type { StatMatch } from "@/lib/stats";

import { PlaqueFlip } from "./plaque-flip";

interface RecordCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  unit: string;
  /** The record-setting match, on the back of the plaque. */
  match?: StatMatch;
  /** Date or other context line under the value. */
  caption?: string;
}

/** One trophy plaque: icon + title and the record stamped in brass; the match behind it is on the back. */
export function RecordCard({ icon: Icon, title, value, unit, match, caption }: RecordCardProps) {
  return (
    <HoloFrame rounded="rounded-xl">
      <PlaqueFlip
        front={
          <div className="flex h-full flex-col gap-3 pr-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-night/50 text-lamp">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="font-display text-lg font-bold leading-tight">{title}</h3>
            </div>
            <div>
              <p className="digits plaque-digits text-score font-bold text-lamp">
                <RollingNumber value={String(value)} />
              </p>
              <p className="text-xs text-ivory-muted">{unit}</p>
            </div>
            {caption && <p className="text-sm font-semibold text-ivory-muted">{caption}</p>}
          </div>
        }
        back={match && <MatchRow match={{ ...match, note: null }} compact />}
      />
    </HoloFrame>
  );
}
