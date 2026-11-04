import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { MatchRow } from "@/components/ui/match-row";
import {
  BadgesPanel,
  cardStats,
  EloSpark,
  FormPanel,
  MoneyPanel,
  Panel,
  PlayerCard,
  RivalsPanel,
  TypeChart,
} from "@/features/player";
import { Link } from "@/i18n/navigation";
import { money } from "@/lib/stats";
import { getPlayerProfile, loadBoard } from "@/server/stats/service";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

/** 5+ losses in a row is the "wanted" rule of lib/stats `wanted()`. */
const WANTED_STREAK = 5;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const profile = await getPlayerProfile(slug);
  return { title: profile?.player.name ?? (await getTranslations("player"))("notFound.title") };
}

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params;
  const [profile, board, t, locale] = await Promise.all([
    getPlayerProfile(slug),
    loadBoard(),
    getTranslations("player"),
    getLocale(),
  ]);
  if (!profile) notFound();

  const { player, stats } = profile;
  const catchphrase = board.roster.find((r) => r.id === player.id)?.catchphrase ?? null;
  const clubPaid = money(board.players, board.all).byPlayer.reduce((sum, p) => sum + p.paid, 0);
  const wanted = stats.current?.result === "L" && stats.current.length >= WANTED_STREAK;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/leaderboard">
          <ArrowLeft aria-hidden className="size-4" />
          {t("back")}
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            <PlayerCard
              player={player}
              catchphrase={catchphrase}
              elo={stats.elo}
              rank={profile.rank}
              streak={stats.current}
              stats={cardStats(player, stats.elo, board.all)}
            />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <FormPanel stats={stats} />
          <Panel id="types-title" title={t("types.title")}>
            {stats.played === 0 ? (
              <p className="text-sm text-ivory-muted">{t("types.empty")}</p>
            ) : (
              <TypeChart byGameType={stats.byGameType} />
            )}
          </Panel>
          <MoneyPanel
            stats={stats}
            clubShare={clubPaid > 0 ? stats.paid / clubPaid : null}
            wantedHref={wanted ? `/api/poster/wanted/${player.slug}?locale=${locale}` : null}
          />
          <RivalsPanel nemesis={profile.rivals.nemesis} prey={profile.rivals.prey} />
          <BadgesPanel earned={profile.badges} />
          <Panel id="elo-title" title={t("elo.title")}>
            <EloSpark history={profile.eloHistory} color={player.ballColor} />
          </Panel>
          <Panel id="recent-title" title={t("recent.title")}>
            {profile.recent.length === 0 ? (
              <p className="text-sm text-ivory-muted">{t("recent.empty")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {profile.recent.map((m) => (
                  <li key={m.id}>
                    <MatchRow match={{ ...m, note: null }} compact />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
