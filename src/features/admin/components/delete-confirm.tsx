import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

import { adminApi } from "../api";
import { useAdminAction } from "../hooks/use-admin-action";
import type { AdminPlayer } from "../types";

/** Confirm sheet for deleting a player; the server archives anyone who has matches and the toast says which. */
export function DeleteConfirm({ player, onClose }: { player: AdminPlayer; onClose: () => void }) {
  const t = useTranslations("admin.delete");
  const toast = useTranslations("admin.toast");
  const { pending, run } = useAdminAction();

  async function handleDelete() {
    const done = await run(async () => {
      const { archived } = await adminApi.deletePlayer(player.id);
      return toast(archived ? "archived" : "deleted", { name: player.name });
    });
    if (done) onClose();
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()} title={t("title", { name: player.name })}>
      <div className="space-y-5 px-5 pb-6 pt-3 safe-bottom">
        <p className="text-sm text-ivory-muted">{t("body")}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" className="flex-1" onClick={onClose} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button
            variant="danger"
            size="lg"
            className="flex-1"
            onClick={handleDelete}
            disabled={pending}
            aria-busy={pending}
          >
            {pending && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
            {t("confirm")}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
