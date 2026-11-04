import { LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type SyntheticEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { formatDate } from "@/lib/domain";

import { adminApi } from "../api";
import { useAdminAction } from "../hooks/use-admin-action";
import type { AdminSession } from "../types";

/** Venue and table of today's lunch session. */
export function SessionCard({ session }: { session: AdminSession }) {
  const t = useTranslations("admin.session");
  const locale = useLocale();
  const { pending, run } = useAdminAction();
  const [venue, setVenue] = useState(session.venue ?? "");
  const [tableLabel, setTableLabel] = useState(session.tableLabel ?? "");

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    await run(async () => {
      await adminApi.saveSession(session.date, { venue: venue.trim() || null, tableLabel: tableLabel.trim() || null });
      return t("saved");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <time dateTime={session.date} className="text-xs text-ivory-muted">
          {formatDate(session.date, locale)}
        </time>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="session-venue">{t("venue")}</Label>
            <Input id="session-venue" value={venue} maxLength={60} onChange={(e) => setVenue(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="session-table">{t("table")}</Label>
            <Input
              id="session-table"
              value={tableLabel}
              maxLength={30}
              onChange={(e) => setTableLabel(e.target.value)}
            />
          </div>
          <Button type="submit" variant="felt" className="w-full" disabled={pending} aria-busy={pending}>
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {t("save")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
