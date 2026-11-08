import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";

import { DeleteConfirm } from "./delete-confirm";
import { PlayerForm } from "./player-form";
import { PlayerRow } from "./player-row";
import type { AdminPlayer } from "../types";

type Editing =
  { kind: "form"; player: AdminPlayer | null; newGuest?: boolean } | { kind: "delete"; player: AdminPlayer } | null;

/** Players CRUD: members and guests apart, each with avatar, ball and number or G, an add / edit sheet, a delete confirm. */
export function PlayersPanel({ players }: { players: AdminPlayer[] }) {
  const t = useTranslations("admin.players");
  const [editing, setEditing] = useState<Editing>(null);
  const close = () => setEditing(null);
  const members = players.filter((p) => !p.guest);
  const guests = players.filter((p) => p.guest);
  const nextBallNumber = Math.min(15, Math.max(0, ...members.map((p) => p.ballNumber)) + 1);

  const rows = (list: AdminPlayer[]) => (
    <ul className="stagger-in divide-y divide-line">
      {list.map((player) => (
        <PlayerRow
          key={player.id}
          player={player}
          onEdit={() => setEditing({ kind: "form", player })}
          onRemove={() => setEditing({ kind: "delete", player })}
        />
      ))}
    </ul>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <Button size="sm" onClick={() => setEditing({ kind: "form", player: null })}>
          <Plus className="size-4" aria-hidden />
          {t("add")}
        </Button>
      </CardHeader>
      <CardBody className="space-y-6">
        <section aria-label={t("membersTitle")}>
          <h4 className="font-display text-base font-bold text-ivory-muted">{t("membersTitle")}</h4>
          {members.length === 0 ? <EmptyState title={t("empty")} body={t("emptyBody")} /> : rows(members)}
        </section>

        <section aria-label={t("guestsTitle")} className="rounded-lg border-2 border-dashed border-chalk/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-display text-base font-bold text-chalk">{t("guestsTitle")}</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing({ kind: "form", player: null, newGuest: true })}
            >
              <Plus className="size-4" aria-hidden />
              {t("addGuest")}
            </Button>
          </div>
          {guests.length === 0 ? <p className="py-3 text-sm text-ivory-muted">{t("guestsEmpty")}</p> : rows(guests)}
        </section>
      </CardBody>
      {editing?.kind === "form" && (
        <PlayerForm
          key={editing.player?.id ?? (editing.newGuest ? "new-guest" : "new")}
          player={editing.player}
          nextBallNumber={nextBallNumber}
          newGuest={editing.newGuest}
          onClose={close}
        />
      )}
      {editing?.kind === "delete" && <DeleteConfirm player={editing.player} onClose={close} />}
    </Card>
  );
}
