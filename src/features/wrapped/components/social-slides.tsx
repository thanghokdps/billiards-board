import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Link } from "@/i18n/navigation";
import { formatPercent, formatVnd } from "@/lib/domain";
import type { AchievementId, StatPlayer } from "@/lib/stats";
import type { WrappedStory } from "@/server/stats/wrapped";

import { ShareButton } from "./share-button";
import { HeroNumber, SlideFrame } from "./slide-frame";

type SlideProps = { story: WrappedStory };

function RivalCard({
  label,
  player,
  line,
  empty,
}: {
  label: string;
  player: StatPlayer | null;
  line: string;
  empty: string;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        {player ? (
          <PlayerAvatar player={player} size="lg" />
        ) : (
          <span aria-hidden className="text-4xl">
            🤷
          </span>
        )}
        <div className="min-w-0">
          <p className="text-2xs font-semibold uppercase tracking-label text-ivory-faint">{label}</p>
          <p className="truncate font-display text-2xl font-bold uppercase tracking-wide">
            {player ? player.name : empty}
          </p>
          {player && <p className="text-sm text-ivory-muted">{line}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

export function RivalsSlide({ story }: SlideProps) {
  const t = useTranslations("wrapped.story.rivals");
  const { nemesis, prey } = story;
  return (
    <SlideFrame kicker={t("kicker")}>
      <RivalCard
        label={t("nemesis")}
        player={nemesis?.player ?? null}
        line={nemesis ? t("nemesisLine", { losses: nemesis.losses, played: nemesis.played }) : ""}
        empty={t("noNemesis")}
      />
      <RivalCard
        label={t("prey")}
        player={prey?.player ?? null}
        line={prey ? t("preyLine", { wins: prey.wins, played: prey.played }) : ""}
        empty={t("noPrey")}
      />
    </SlideFrame>
  );
}

export function MoneySlide({ story }: SlideProps) {
  const t = useTranslations("wrapped.story.money");
  const locale = useLocale();
  const { paid, paidRank, payers, topCollector } = story;
  const verdict = paid === 0 ? t("none") : paidRank === 1 ? t("top") : t("ranked", { rank: paidRank, total: payers });
  return (
    <SlideFrame kicker={t("kicker")}>
      <div>
        <HeroNumber glow={false} className="text-7xl text-loss">
          {formatVnd(paid, locale)}
        </HeroNumber>
        <p className="mt-2 text-lg font-semibold">{t("caption")}</p>
      </div>
      <p className="text-sm text-ivory-muted">{verdict}</p>
      {topCollector && (
        <p className="text-sm text-ivory-muted">
          {t("collector", { name: topCollector.player.name, amount: formatVnd(topCollector.amount, locale) })}
        </p>
      )}
    </SlideFrame>
  );
}

const BADGE_ICON: Record<AchievementId, string> = {
  sniper_3c: "🎯",
  atm: "💸",
  phoenix: "🔥",
  clock: "⏰",
  unstoppable: "🚀",
  upset_king: "👑",
};

/** Last slide: badges earned, then share / profile / replay. */
export function BadgesSlide({ story, onReplay }: SlideProps & { onReplay: () => void }) {
  const t = useTranslations("wrapped.story");
  const locale = useLocale();
  const { badges, player, year } = story;
  const shareText = t("share.text", {
    name: player.name,
    year,
    matches: story.played,
    winRate: formatPercent(story.winRate, locale),
  });
  return (
    <SlideFrame kicker={t("badges.kicker")} className="justify-start pt-6">
      {badges.length === 0 ? (
        <p className="text-lg font-semibold">{t("badges.none")}</p>
      ) : (
        <ul className="space-y-2">
          {badges.map((id) => (
            <li key={id} className="flex items-center gap-3 rounded-lg border border-line bg-surface/70 p-3">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lamp/15 text-2xl"
              >
                {BADGE_ICON[id]}
              </span>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold uppercase tracking-wide">{t(`badges.${id}`)}</p>
                <p className="text-xs text-ivory-muted">{t(`badges.${id}_hint`)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto space-y-3">
        <p className="font-display text-sm font-bold uppercase tracking-label text-ivory-muted">{t("share.title")}</p>
        <div className="pointer-events-auto flex flex-wrap gap-2">
          <ShareButton title={shareText} text={shareText} />
          <Button asChild variant="outline" className="pointer-events-auto">
            <Link href={`/players/${player.slug}`}>{t("share.profile")}</Link>
          </Button>
          <Button variant="ghost" onClick={onReplay} className="pointer-events-auto">
            {t("share.replay")}
          </Button>
        </div>
      </div>
    </SlideFrame>
  );
}
