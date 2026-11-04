import { useTranslations } from "next-intl";

import { GameTypeBadge } from "@/components/ui/game-type-badge";
import { Link } from "@/i18n/navigation";
import type { PlayerStats } from "@/lib/stats";

import { FormLine } from "./form-line";

/** The stats that have no ranking, for the whole group at once. */
export function GroupFormList({ ranked }: { ranked: PlayerStats[] }) {
  const t = useTranslations("leaderboard.table");
  return (
    <div>
      <p className="mb-1 font-bold">{t("groupTitle")}</p>
      <ul className="divide-y divide-line">
        {ranked.map((s) => (
          <li key={s.player.id} className="space-y-1.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/players/${s.player.slug}`}
                className="truncate rounded-sm text-sm font-semibold hover:text-lamp"
              >
                {s.player.name}
              </Link>
              <FormLine form={s.form} />
            </div>
            <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ivory-muted">
              <div className="flex items-center gap-1">
                <dt>{t("strongest")}</dt>
                <dd>{s.strongest ? <GameTypeBadge gameType={s.strongest} /> : "—"}</dd>
              </div>
              <div className="flex items-center gap-1">
                <dt>{t("weakest")}</dt>
                <dd>{s.weakest ? <GameTypeBadge gameType={s.weakest} /> : "—"}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
