"use client";

import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Sheet } from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";
import { formatDate, GAME_LABEL, GAME_TYPES, type GameType, type Side } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";

import { predictionsApi } from "../api";
import { SideToggle } from "./side-toggle";

interface PredictionCreatorProps {
  /** Local date the prediction is for (today). */
  date: string;
  roster: PlayerRef[];
}

export function PredictionCreator({ date, roster }: PredictionCreatorProps) {
  const t = useTranslations("predictions.create");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        {t("open")}
      </Button>
      <Sheet open={open} onOpenChange={setOpen} title={t("title")} side="responsive">
        <CreateForm date={date} roster={roster} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

/** Mounted only while the sheet is open, so every open starts from a blank form. */
function CreateForm({ date, roster, onDone }: PredictionCreatorProps & { onDone: () => void }) {
  const t = useTranslations("predictions.create");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [picks, setPicks] = useState<Record<number, Side>>({});
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [saving, setSaving] = useState(false);

  const idsOn = (side: Side) => roster.filter((p) => picks[p.id] === side).map((p) => p.id);
  const sideA = idsOn("a");
  const sideB = idsOn("b");
  const valid = sideA.length >= 1 && sideA.length <= 2 && sideA.length === sideB.length;

  function setPick(id: number, next: Side | null) {
    setPicks((current) => {
      const rest = Object.fromEntries(Object.entries(current).filter(([key]) => Number(key) !== id));
      return next ? { ...rest, [id]: next } : rest;
    });
  }

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    try {
      await predictionsApi.create({ date, gameType, sideA, sideB });
      toast.success(t("created"));
      onDone();
      router.refresh();
    } catch {
      toast.error(t("failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <p className="text-sm text-ivory-muted">
          {t("hint")} {t("forDate", { date: formatDate(date, locale) })}
        </p>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ivory-muted">{t("gameType")}</legend>
          <div className="flex flex-wrap gap-2">
            <Chip selected={gameType === null} onClick={() => setGameType(null)}>
              {t("anyGame")}
            </Chip>
            {GAME_TYPES.map((type) => (
              <Chip key={type} selected={gameType === type} onClick={() => setGameType(type)}>
                {GAME_LABEL[type]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ivory-muted">{t("players")}</legend>
          <ul className="space-y-2">
            {roster.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-2/70 p-2.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <PlayerAvatar player={p} size="sm" />
                  <span className="truncate font-bold">{p.name}</span>
                </span>
                <SideToggle
                  value={picks[p.id] ?? null}
                  onChange={(next) => setPick(p.id, next)}
                  labelA={t("sideA")}
                  labelB={t("sideB")}
                  clearable
                  disabled={{
                    a: picks[p.id] !== "a" && sideA.length >= 2,
                    b: picks[p.id] !== "b" && sideB.length >= 2,
                  }}
                />
              </li>
            ))}
          </ul>
        </fieldset>
        <p aria-live="polite" className="min-h-5 text-sm text-loss">
          {sideA.length + sideB.length > 0 && !valid ? t("sizeMismatch") : ""}
        </p>
      </div>
      <div className="flex gap-2 border-t border-line p-4">
        <Button variant="outline" onClick={onDone} className="flex-1">
          {tc("cancel")}
        </Button>
        <Button type="submit" disabled={!valid || saving} className="flex-1">
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
