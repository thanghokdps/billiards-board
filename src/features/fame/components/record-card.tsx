import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { MatchRow } from "@/components/ui/match-row";
import type { StatMatch } from "@/lib/stats";

interface RecordCardProps {
  icon: LucideIcon;
  title: string;
  value: ReactNode;
  unit: string;
  /** The record-setting match, shown as a compact scoreboard row. */
  match?: StatMatch;
  /** Date or other context line under the value. */
  caption?: string;
}

/** One trophy: icon + title, the record as LED digits, and the match behind it. */
export function RecordCard({ icon: Icon, title, value, unit, match, caption }: RecordCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lamp/15 text-lamp">
          <Icon className="size-5" aria-hidden />
        </span>
        <h3 className="font-display text-lg font-bold leading-tight">{title}</h3>
      </div>
      <div>
        <p className="digits text-score font-bold text-lamp digits-glow">{value}</p>
        <p className="text-xs text-ivory-muted">{unit}</p>
      </div>
      {caption && <p className="text-sm font-semibold text-ivory-muted">{caption}</p>}
      {match && <MatchRow match={{ ...match, note: null }} compact />}
    </Card>
  );
}
