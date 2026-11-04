import { useLocale, useTranslations } from "next-intl";

import { Card, CardBody } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatPercent } from "@/lib/domain";
import type { StatPlayer } from "@/lib/stats";

import { SectionTitle } from "./section-title";

type Matrix = Record<number, Record<number, { wins: number; played: number }>>;

/** Loss colour at 0 %, win colour at 100 %; bright enough to carry dark digits on every step of the scale. */
function heat(rate: number): string {
  return `color-mix(in oklab, var(--color-win) ${Math.round(rate * 100)}%, var(--color-loss))`;
}

/** Row player's win rate against the column player as chalk cubes: the better the record, the taller the cube. */
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
          <div className="h2h-stage relative overflow-x-auto pt-3 pb-2">
            <table className="border-separate border-spacing-x-1 border-spacing-y-3 text-center sm:border-spacing-x-1.5">
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
                          <td key={col.id} aria-label={t("self", { name: row.name })} className="p-0">
                            <span aria-hidden className="h2h-slot h2h-slot-self" />
                          </td>
                        );
                      }
                      const cell = matrix[row.id]?.[col.id];
                      if (!cell || cell.played === 0) {
                        return (
                          <td key={col.id} aria-label={t("none", { row: row.name, col: col.name })} className="p-0">
                            <span aria-hidden className="h2h-slot" />
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
                          className="p-0"
                        >
                          <span
                            aria-hidden
                            className="h2h-cube"
                            style={{ ["--heat" as string]: heat(rate), ["--rate" as string]: rate }}
                          >
                            <span className="digits text-lg font-bold leading-none sm:text-2xl">
                              {formatPercent(rate, locale)}
                            </span>
                            <span className="pt-0.5 text-2xs font-semibold leading-none">
                              {cell.wins}/{cell.played}
                            </span>
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
              }}
            />
            <span>{t("legendWin")}</span>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
