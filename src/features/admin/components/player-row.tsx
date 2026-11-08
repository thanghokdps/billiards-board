import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Ball } from "@/components/ui/ball";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/ui/player-avatar";

import type { AdminPlayer } from "../types";

interface PlayerRowProps {
  player: AdminPlayer;
  onEdit: () => void;
  onRemove: () => void;
}

/** One roster line. A guest's note sits under the name, in chalk, as it would on the slate they were added from. */
export function PlayerRow({ player, onEdit, onRemove }: PlayerRowProps) {
  const t = useTranslations("admin.players");
  return (
    <li className="flex items-center gap-2 py-3">
      <PlayerAvatar player={player} size="md" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-bold">
          <span className="truncate">{player.name}</span>
          {!player.active && <Badge>{t("inactive")}</Badge>}
        </p>
        <p className="truncate text-xs text-ivory-muted">{player.nickname ?? player.slug}</p>
        {player.note && <p className="mt-0.5 line-clamp-2 text-xs italic text-chalk">{player.note}</p>}
      </div>
      <Ball color={player.ballColor} number={player.ballNumber} guest={player.guest} className="ball-roll size-8" />
      <Button variant="ghost" size="icon" aria-label={t("edit", { name: player.name })} onClick={onEdit}>
        <Pencil className="size-4" aria-hidden />
      </Button>
      <Button variant="ghost" size="icon" aria-label={t("remove", { name: player.name })} onClick={onRemove}>
        <Trash2 className="size-4 text-loss" aria-hidden />
      </Button>
    </li>
  );
}
