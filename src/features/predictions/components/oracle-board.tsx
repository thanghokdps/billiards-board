import { useLocale, useTranslations } from "next-intl";

import { EmptyState } from "@/components/ui/misc";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/domain";

import type { OracleRow } from "../lib/oracle";

/** Display order puts the winner in the middle: 2nd, 1st, 3rd. */
const PODIUM = [
  { index: 1, block: "h-16 bg-surface-3" },
  { index: 0, block: "h-24 bg-lamp/20 border-lamp/50" },
  { index: 2, block: "h-12 bg-surface-2" },
] as const;

export function OracleBoard({ rows }: { rows: OracleRow[] }) {
  const t = useTranslations("predictions.oracle");
  const locale = useLocale();

  if (rows.length === 0) return <EmptyState title={t("empty")} body={t("emptyBody")} />;

  return (
    <div className="space-y-4">
      <ol aria-label={t("podium")} className="grid grid-cols-3 items-end gap-2">
        {PODIUM.map(({ index, block }) => {
          const row = rows[index];
          if (!row) return <li key={index} aria-hidden />;
          return (
            <li key={index} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
              <PlayerAvatar player={row.player} size={index === 0 ? "lg" : "md"} />
              <p className="max-w-full truncate text-sm font-bold">{row.player.name}</p>
              <p className="digits text-xl font-bold leading-none text-ivory">
                {t("record", { correct: row.correct, total: row.total })}
              </p>
              <div
                className={cn(
                  "flex w-full items-start justify-center rounded-t-md border border-b-0 border-line pt-2",
                  block,
                )}
              >
                <span
                  className={cn(
                    "digits text-2xl font-bold",
                    index === 0 ? "text-lamp digits-glow" : "text-ivory-muted",
                  )}
                >
                  {index + 1}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("caption")}</caption>
          <thead>
            <tr className="border-b border-line text-left text-2xs uppercase tracking-label text-ivory-faint">
              <th scope="col" className="px-4 py-2.5 font-semibold">
                {t("rank")}
              </th>
              <th scope="col" className="px-2 py-2.5 font-semibold">
                {t("player")}
              </th>
              <th scope="col" className="px-2 py-2.5 text-right font-semibold">
                {t("correct")}
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                {t("accuracy")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.player.id} className="border-b border-line last:border-0">
                <td className="digits px-4 py-2.5 text-lg font-bold text-ivory-muted">{i + 1}</td>
                <td className="px-2 py-2.5">
                  <Link
                    href={`/players/${row.player.slug}`}
                    className="flex items-center gap-2 font-bold hover:text-lamp"
                  >
                    <PlayerAvatar player={row.player} size="xs" />
                    {row.player.name}
                  </Link>
                </td>
                <td className="digits px-2 py-2.5 text-right text-lg font-bold">
                  {t("record", { correct: row.correct, total: row.total })}
                </td>
                <td className="digits px-4 py-2.5 text-right text-lg font-bold text-lamp">
                  {formatPercent(row.accuracy, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
