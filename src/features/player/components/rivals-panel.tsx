import { useTranslations } from "next-intl";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { SectionTitle } from "@/features/leaderboard";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { StatPlayer } from "@/lib/stats";

interface Rival {
  player: StatPlayer;
  count: number;
  played: number;
}

function RivalCard({ kind, rival }: { kind: "nemesis" | "prey"; rival: Rival | null }) {
  const t = useTranslations("player.rivals");
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        kind === "nemesis" ? "border-loss/30 bg-loss/5" : "border-win/30 bg-win/5",
      )}
    >
      <p
        className={cn("text-2xs font-semibold uppercase tracking-label", kind === "nemesis" ? "text-loss" : "text-win")}
      >
        {t(kind)}
      </p>
      {rival ? (
        <Link
          href={`/players/${rival.player.slug}`}
          className="mt-2 flex items-center gap-3 rounded-sm hover:text-lamp"
        >
          <PlayerAvatar player={rival.player} size="md" />
          <span className="min-w-0">
            <span className="block truncate font-bold">{rival.player.name}</span>
            <span className="block text-xs text-ivory-muted">
              {t(`${kind}Body`, { count: rival.count, played: rival.played })}
            </span>
          </span>
        </Link>
      ) : (
        <p className="mt-2 text-sm text-ivory-muted">{t("none")}</p>
      )}
    </div>
  );
}

interface RivalsPanelProps {
  nemesis: { player: StatPlayer; losses: number; played: number } | null;
  prey: { player: StatPlayer; wins: number; played: number } | null;
}

/** Nemesis (loses to most) and prey (beats most), each linking to that player's profile. */
export function RivalsPanel({ nemesis, prey }: RivalsPanelProps) {
  const t = useTranslations("player.rivals");
  return (
    <section aria-labelledby="rivals-title">
      <Card>
        <CardHeader>
          <SectionTitle id="rivals-title">{t("title")}</SectionTitle>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <RivalCard
            kind="nemesis"
            rival={nemesis && { player: nemesis.player, count: nemesis.losses, played: nemesis.played }}
          />
          <RivalCard kind="prey" rival={prey && { player: prey.player, count: prey.wins, played: prey.played }} />
        </CardBody>
      </Card>
    </section>
  );
}
