"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";

import { PlayersPanel } from "./players-panel";
import { QuickLinks } from "./quick-links";
import { adminApi } from "../api";
import { useAdminAction } from "../hooks/use-admin-action";
import type { AdminPlayer } from "../types";

export function AdminDashboard({ players }: { players: AdminPlayer[] }) {
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
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlayersPanel players={players} />
        </div>
        <QuickLinks />
      </div>
    </div>
  );
}
