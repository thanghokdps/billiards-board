import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminDashboard, AdminLogin } from "@/features/admin";
import { isAdmin } from "@/server/auth/session";
import { listPlayers } from "@/server/players/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("title") };
}

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  const roster = await listPlayers({ includeInactive: true });
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <AdminDashboard
        players={roster.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          nickname: p.nickname,
          aliases: p.aliases,
          avatarUrl: p.avatarUrl,
          ballColor: p.ballColor,
          ballNumber: p.ballNumber,
          catchphrase: p.catchphrase,
          active: p.active,
          guest: p.guest,
          note: p.note,
        }))}
      />
    </div>
  );
}
