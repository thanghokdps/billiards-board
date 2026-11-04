import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { cn } from "@/lib/cn";
import type { StatPlayer } from "@/lib/stats";

import { ChatButton } from "./chat-button";
import type { PairingOption } from "../lib/pairing";

const names = (players: StatPlayer[]) => players.map((p) => p.name).join(" & ");

function PairSide({ players, avg, align }: { players: StatPlayer[]; avg: number; align: "left" | "right" }) {
  const t = useTranslations("home.pairing");
  const right = align === "right";
  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-2", right && "flex-row-reverse text-right")}>
      <div className={cn("flex shrink-0", right ? "flex-row-reverse -space-x-reverse" : "", "-space-x-2")}>
        {players.map((p) => (
          <PlayerAvatar key={p.id} player={p} size="sm" />
        ))}
      </div>
      <div className="min-w-0">
        <p className="font-bold leading-tight">{names(players)}</p>
        <p className="digits whitespace-nowrap text-sm text-ivory-muted">{t("elo", { value: Math.round(avg) })}</p>
      </div>
    </div>
  );
}

/** The closest matchups by Elo for today's attendees; the admin can start recording one in the chat. */
export function PairingCard({ options, admin }: { options: PairingOption[]; admin: boolean }) {
  const t = useTranslations("home.pairing");
  return (
    <Card>
      <CardBody>
        <ul className="space-y-3">
          {options.map((o) => (
            <li
              key={`${o.format}-${o.sideA.map((p) => p.id).join()}-${o.sideB.map((p) => p.id).join()}`}
              className="space-y-2.5 rounded-md border border-line bg-surface-2/70 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge tone="felt" size="md">
                  {o.format}
                </Badge>
                <span className="text-xs font-semibold text-ivory-muted">{t("gap", { gap: Math.round(o.gap) })}</span>
              </div>
              <div className="flex items-center gap-2">
                <PairSide players={o.sideA} avg={o.avgA} align="left" />
                <span className="font-display text-lg font-bold text-lamp">VS</span>
                <PairSide players={o.sideB} avg={o.avgB} align="right" />
              </div>
              {admin && (
                <ChatButton
                  label={t("record")}
                  prefill={t("prompt", { sideA: names(o.sideA), sideB: names(o.sideB) })}
                />
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
