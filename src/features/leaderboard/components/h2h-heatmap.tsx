import { useLocale, useTranslations } from "next-intl";

import { Card, CardBody } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatPercent } from "@/lib/domain";
import type { StatPlayer } from "@/lib/stats";

import { SectionTitle } from "./section-title";

type Matrix = Record<number, Record<number, { wins: number; played: number }>>;

/** Loss colour at 0 %, win colour at 100 %, laid over the card so the scale stays dark-theme friendly. */
function heat(rate: number): string {
  const scale = `color-mix(in oklab, var(--color-win) ${Math.round(rate * 100)}%, var(--color-loss))`;
  return `color-mix(in oklab, ${scale} 62%, var(--color-surface))`;
}

/** Row player's win rate against the column player. Scrolls inside the card on a phone. */
export function H2hHeatmap({ players, matrix }: { players: StatPlayer[]; matrix: Matrix }) {
  const t = useTranslations("leaderboard.h2h");
  const locale = useLocale();
  return (
    <section aria-labelledby="h2h-title" className="space-y-3">
      <div>
        <SectionTitle id="h2h-title">{t("title")}</SectionTitle>
        <p className="mt-1 text-xs text-ivory-muted">{t("hint")}</p>
      </div>
      <Card>
        <CardBody className="space-y-3">
          <div className="relative overflow-x-auto">
            <table className="border-separate border-spacing-1 text-center">
              <caption className="sr-only">{t("title")}</caption>
              <thead>
                <tr>
                  <td />
                  {players.map((col) => (
                    <th key={col.id} scope="col" className="p-1 font-normal">
                      <span className="inline-flex flex-col items-center gap-1">
                        <PlayerAvatar player={col} size="xs" />
                        <span className="max-w-12 truncate text-2xs text-ivory-muted">{col.name}</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="pr-1 text-left font-normal">
                      <span className="flex items-center gap-1.5">
                        <PlayerAvatar player={row} size="xs" />
                        <span className="max-w-16 truncate text-xs font-semibold max-sm:sr-only">{row.name}</span>
                      </span>
                    </th>
                    {players.map((col) => {
                      if (row.id === col.id) {
                        return (
                          <td
                            key={col.id}
                            aria-label={t("self", { name: row.name })}
                            className="size-12 rounded-sm bg-night/60"
                          />
                        );
                      }
                      const cell = matrix[row.id]?.[col.id];
                      if (!cell || cell.played === 0) {
                        return (
                          <td
                            key={col.id}
                            aria-label={t("none", { row: row.name, col: col.name })}
                            className="size-12 rounded-sm border border-dashed border-line-strong text-ivory-faint"
                          >
                            <span aria-hidden>·</span>
                          </td>
                        );
                      }
                      const rate = cell.wins / cell.played;
                      return (
                        <td
                          key={col.id}
                          aria-label={t("cell", {
                            row: row.name,
                            col: col.name,
                            wins: cell.wins,
                            played: cell.played,
                            rate: formatPercent(rate, locale),
                          })}
                          className="size-12 rounded-sm"
                          style={{ backgroundColor: heat(rate) }}
                        >
                          <span aria-hidden className="block digits text-base font-bold leading-none text-ivory">
                            {formatPercent(rate, locale)}
                          </span>
                          <span aria-hidden className="block pt-0.5 text-2xs leading-none text-ivory-muted">
                            {cell.wins}/{cell.played}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 text-2xs text-ivory-muted" aria-hidden>
            <span>{t("legendLoss")}</span>
            <span
              className="h-2 flex-1 rounded-full"
              style={{
                backgroundImage: "linear-gradient(to right, var(--color-loss), var(--color-win))",
                opacity: 0.62,
              }}
            />
            <span>{t("legendWin")}</span>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
