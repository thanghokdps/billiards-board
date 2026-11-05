import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Ball } from "@/components/ui/ball";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { PlayerAvatar } from "@/components/ui/player-avatar";

import { DeleteConfirm } from "./delete-confirm";
import { PlayerForm } from "./player-form";
import type { AdminPlayer } from "../types";

type Editing = { kind: "form"; player: AdminPlayer | null } | { kind: "delete"; player: AdminPlayer } | null;

/** Players CRUD: the roster with avatar, ball colour and number, an add / edit sheet, a delete confirm. */
export function PlayersPanel({ players }: { players: AdminPlayer[] }) {
  const t = useTranslations("admin.players");
  const [editing, setEditing] = useState<Editing>(null);
  const close = () => setEditing(null);
  const nextBallNumber = Math.min(15, Math.max(0, ...players.map((p) => p.ballNumber)) + 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <Button size="sm" onClick={() => setEditing({ kind: "form", player: null })}>
          <Plus className="size-4" aria-hidden />
          {t("add")}
        </Button>
      </CardHeader>
      <CardBody>
        {players.length === 0 ? (
          <EmptyState title={t("empty")} body={t("emptyBody")} />
        ) : (
          <ul className="stagger-in divide-y divide-line">
            {players.map((player) => (
              <li key={player.id} className="flex items-center gap-3 py-3">
                <PlayerAvatar player={player} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-bold">
                    <span className="truncate">{player.name}</span>
                    {!player.active && <Badge>{t("inactive")}</Badge>}
                  </p>
                  <p className="truncate text-xs text-ivory-muted">{player.nickname ?? player.slug}</p>
                </div>
                <Ball color={player.ballColor} number={player.ballNumber} className="ball-roll size-8" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("edit", { name: player.name })}
                  onClick={() => setEditing({ kind: "form", player })}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("remove", { name: player.name })}
                  onClick={() => setEditing({ kind: "delete", player })}
                >
                  <Trash2 className="size-4 text-loss" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
      {editing?.kind === "form" && (
        <PlayerForm
          key={editing.player?.id ?? "new"}
          player={editing.player}
          nextBallNumber={nextBallNumber}
          onClose={close}
        />
      )}
      {editing?.kind === "delete" && <DeleteConfirm player={editing.player} onClose={close} />}
    </Card>
  );
}
