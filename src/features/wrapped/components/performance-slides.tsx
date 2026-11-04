import { useLocale, useTranslations } from "next-intl";

import { Stat } from "@/components/ui/misc";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatDate, formatPercent, GAME_LABEL } from "@/lib/domain";
import type { WrappedStory } from "@/server/stats/wrapped";

import { HeroNumber, SlideFrame } from "./slide-frame";

type SlideProps = { story: WrappedStory };

export function IntroSlide({ story }: SlideProps) {
  const t = useTranslations("wrapped.story.intro");
  const { player, year } = story;
  return (
    <SlideFrame kicker={t("kicker", { year })} className="items-center text-center">
      <PlayerAvatar player={player} size="xl" />
      <div>
        <p className="text-sm text-ivory-muted">{t("lead")}</p>
        <p className="font-display text-hero font-extrabold">{player.name}</p>
        {player.nickname && <p className="text-sm text-ivory-muted">{player.nickname}</p>}
      </div>
      {player.catchphrase && <p className="max-w-xs text-sm italic text-ivory-muted">“{player.catchphrase}”</p>}
      <p className="text-xs text-ivory-faint">{t("hint")}</p>
    </SlideFrame>
  );
}

export function MatchesSlide({ story }: SlideProps) {
  const t = useTranslations("wrapped.story.matches");
  const locale = useLocale();
  const verdict = story.winRate >= 0.6 ? "high" : story.winRate >= 0.45 ? "mid" : "low";
  return (
    <SlideFrame kicker={t("kicker")}>
      <div>
        <HeroNumber>{story.played}</HeroNumber>
        <p className="mt-2 text-lg font-semibold">{t("caption", { count: story.played, year: story.year })}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-line bg-surface/70 p-4">
        <Stat label={t("rate")} value={formatPercent(story.winRate, locale)} accent />
        <Stat label={t("record")} value={`${story.wins}–${story.losses}`} />
      </div>
      <div
        role="img"
        aria-label={formatPercent(story.winRate, locale)}
        className="h-2 overflow-hidden rounded-full bg-surface-3"
      >
        <div className="h-full rounded-full bg-win" style={{ width: `${Math.round(story.winRate * 100)}%` }} />
      </div>
      <p className="text-sm text-ivory-muted">
        {t(verdict)} {t("sessions", { count: story.sessions })}
      </p>
    </SlideFrame>
  );
}

export function FavouriteSlide({ story }: SlideProps) {
  const t = useTranslations("wrapped.story.favourite");
  const locale = useLocale();
  const { favourite } = story;
  if (!favourite) return null;
  return (
    <SlideFrame kicker={t("kicker")}>
      <p className="font-display text-7xl font-extrabold leading-none text-lamp digits-glow">
        {GAME_LABEL[favourite.gameType]}
      </p>
      <p className="text-lg font-semibold">
        {t("caption", { played: favourite.played, winRate: formatPercent(favourite.winRate, locale) })}
      </p>
    </SlideFrame>
  );
}

export function StreakSlide({ story }: SlideProps) {
  const t = useTranslations("wrapped.story.streak");
  const n = story.longestWinStreak;
  const verdict = n >= 5 ? "high" : n >= 3 ? "mid" : n >= 1 ? "low" : "none";
  return (
    <SlideFrame kicker={t("kicker")}>
      <div className="flex items-end gap-3">
        <HeroNumber>{n}</HeroNumber>
        {n >= 3 && (
          <span aria-hidden className="pb-2 text-6xl">
            🔥
          </span>
        )}
      </div>
      {n > 0 && <p className="text-lg font-semibold">{t("unit", { count: n })}</p>}
      <p className="text-sm text-ivory-muted">{t(verdict)}</p>
    </SlideFrame>
  );
}

export function BestDaySlide({ story }: SlideProps) {
  const t = useTranslations("wrapped.story.bestDay");
  const locale = useLocale();
  const { bestDay } = story;
  return (
    <SlideFrame kicker={t("kicker")}>
      {bestDay ? (
        <>
          <p className="font-display text-5xl font-extrabold leading-tight text-lamp digits-glow">
            {formatDate(bestDay.date, locale, "long")}
          </p>
          <p className="text-lg font-semibold">{t("line", { wins: bestDay.wins, played: bestDay.played })}</p>
        </>
      ) : (
        <p className="text-lg font-semibold">{t("none")}</p>
      )}
    </SlideFrame>
  );
}
