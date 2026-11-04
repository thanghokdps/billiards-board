import { useLocale, useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { GameTypeBadge } from "@/components/ui/game-type-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatPercent, formatVnd } from "@/lib/domain";
import type { PlayerStats } from "@/lib/stats";

import { FormLine } from "./form-line";
import { SectionTitle } from "./section-title";

const HEAD = "px-3 py-2 text-left text-2xs font-semibold uppercase tracking-label text-ivory-faint whitespace-nowrap";
const CELL = "px-3 py-2.5 whitespace-nowrap";

/** Every player, ranked. Scrolls sideways inside the card on a phone; the name column stays put. */
export function StandingsTable({ ranked }: { ranked: PlayerStats[] }) {
  const t = useTranslations("leaderboard.table");
  const common = useTranslations("common");
  const locale = useLocale();
  return (
    <section aria-labelledby="table-title" className="space-y-3">
      <SectionTitle id="table-title">{t("title")}</SectionTitle>
      <Card className="overflow-hidden">
        {/* `relative` keeps the cells' absolutely positioned sr-only text inside the scroll box. */}
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-250 border-collapse text-sm">
            <caption className="sr-only">{t("caption")}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className={cn(HEAD, "sticky left-0 z-10 bg-surface")}>
                  {t("player")}
                </th>
                <th scope="col" className={cn(HEAD, "text-right")}>
                  {t("played")}
                </th>
                <th scope="col" className={cn(HEAD, "text-right")}>
                  {t("record")}
                </th>
                <th scope="col" className={cn(HEAD, "text-right")}>
                  {t("winRate")}
                </th>
                <th scope="col" className={cn(HEAD, "text-right")}>
                  {t("avgPoints")}
                </th>
                <th scope="col" className={HEAD}>
                  {t("streak")}
                </th>
                <th scope="col" className={cn(HEAD, "text-right")}>
                  {t("bestWin")}
                </th>
                <th scope="col" className={cn(HEAD, "text-right")}>
                  {t("bestLoss")}
                </th>
                <th scope="col" className={HEAD}>
                  {t("form")}
                </th>
                <th scope="col" className={cn(HEAD, "text-right")}>
                  {t("paid")}
                </th>
                <th scope="col" className={HEAD}>
                  {t("strongest")}
                </th>
                <th scope="col" className={HEAD}>
                  {t("weakest")}
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((s, i) => {
                const idle = s.played === 0;
                return (
                  <tr
                    key={s.player.id}
                    className={cn("border-b border-line last:border-b-0", idle && "text-ivory-faint")}
                  >
                    <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left font-normal">
                      <Link
                        href={`/players/${s.player.slug}`}
                        className="flex items-center gap-2.5 rounded-sm font-bold hover:text-lamp"
                      >
                        <span className="w-4 digits text-base text-ivory-faint">{i + 1}</span>
                        <PlayerAvatar player={s.player} size="sm" streak={s.current} />
                        <span className="max-w-28 truncate">{s.player.name}</span>
                      </Link>
                    </th>
                    <td className={cn(CELL, "text-right digits text-base")}>{s.played}</td>
                    <td className={cn(CELL, "text-right digits text-base")}>
                      {common("record", { wins: s.wins, losses: s.losses })}
                    </td>
                    <td className={cn(CELL, "text-right digits text-base font-bold", !idle && "text-lamp")}>
                      {idle ? "—" : formatPercent(s.winRate, locale)}
                    </td>
                    <td className={cn(CELL, "text-right digits text-base")}>
                      {s.avgPoints == null ? "—" : s.avgPoints.toFixed(1)}
                    </td>
                    <td className={CELL}>
                      {s.current ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 digits text-base font-bold",
                            s.current.result === "W" ? "text-win" : "text-cold",
                          )}
                          aria-label={common(s.current.result === "W" ? "streakHot" : "streakCold", {
                            count: s.current.length,
                          })}
                        >
                          <span aria-hidden>{s.current.result === "W" ? "🔥" : "🧊"}</span>
                          <span aria-hidden>{s.current.length}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={cn(CELL, "text-right digits text-base text-win")}>{s.longestWinStreak || "—"}</td>
                    <td className={cn(CELL, "text-right digits text-base text-loss")}>{s.longestLossStreak || "—"}</td>
                    <td className={CELL}>
                      <FormLine form={s.form} />
                    </td>
                    <td className={cn(CELL, "text-right")}>{s.paid ? formatVnd(s.paid, locale) : "—"}</td>
                    <td className={CELL}>{s.strongest ? <GameTypeBadge gameType={s.strongest} /> : "—"}</td>
                    <td className={CELL}>{s.weakest ? <GameTypeBadge gameType={s.weakest} /> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-2xs text-ivory-faint">{t("hint")}</p>
    </section>
  );
}
