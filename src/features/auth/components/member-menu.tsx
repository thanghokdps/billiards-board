"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover } from "radix-ui";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { useRouter } from "@/i18n/navigation";
import type { PlayerRef } from "@/server/matches/schema";

import { signOut } from "../api";

/** The signed-in member's ball in the header; opens a small plate with their name and the way out. */
export function MemberMenu({ player }: { player: PlayerRef }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
      setOpen(false);
      toast.success(t("signedOut"));
      router.refresh();
    } catch {
      toast.error(t("signOutFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={t("menu", { name: player.name })}
        className="flex size-11 cursor-pointer items-center justify-center rounded-full hover:bg-surface-2"
      >
        <PlayerAvatar player={player} size="sm" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className="popover-pop z-50 w-56 rounded-md border border-line-strong bg-surface p-3 shadow-pop outline-none"
        >
          <div className="mb-3 flex items-center gap-3">
            <PlayerAvatar player={player} size="md" />
            <div className="min-w-0">
              <p className="text-2xs font-semibold text-ivory-muted">{t("signedInAs")}</p>
              <p className="truncate font-display text-xl leading-tight font-bold">{player.name}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" disabled={busy} aria-busy={busy} onClick={handleSignOut}>
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="size-4" aria-hidden />
            )}
            {t("signOut")}
          </Button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
