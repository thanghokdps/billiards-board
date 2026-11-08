"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import type { SubmissionView } from "@/server/submissions/schema";

import { PendingStack } from "./pending-stack";
import { PlayersPanel } from "./players-panel";
import { QuickLinks } from "./quick-links";
import { adminApi } from "../api";
import { useAdminAction } from "../hooks/use-admin-action";
import type { AdminPlayer } from "../types";

interface AdminDashboardProps {
  players: AdminPlayer[];
  submissions: SubmissionView[];
  /** Server time, for the slips' "3 minutes ago". */
  now: string;
}

export function AdminDashboard({ players, submissions, now }: AdminDashboardProps) {
  const t = useTranslations("admin");
  const { pending, run } = useAdminAction();

  const handleLogout = () =>
    run(async () => {
      await adminApi.logout();
      return t("logout.done");
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        kicker={t("kicker")}
        actions={
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={pending}>
            <LogOut className="size-4" aria-hidden />
            {t("logout.button")}
          </Button>
        }
      />
      <PendingStack pending={submissions} now={now} players={players} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlayersPanel players={players} />
        </div>
        <QuickLinks />
      </div>
    </div>
  );
}
