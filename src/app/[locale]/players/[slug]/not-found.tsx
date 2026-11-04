import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Link } from "@/i18n/navigation";

export default async function PlayerNotFound() {
  const t = await getTranslations("player.notFound");
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <EmptyState
        title={t("title")}
        body={t("body")}
        action={
          <Button asChild>
            <Link href="/leaderboard">{t("action")}</Link>
          </Button>
        }
      />
    </div>
  );
}
