import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type SyntheticEvent } from "react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input, Textarea } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";

import { AvatarField } from "./avatar-field";
import { ColourPicker } from "./colour-picker";
import { describedBy, FormField } from "./form-field";
import { adminApi } from "../api";
import { useAdminAction } from "../hooks/use-admin-action";
import { initialForm, slugify, validateForm, type PlayerField, type PlayerFormState } from "../lib/player-form";
import type { AdminPlayer } from "../types";

interface PlayerFormProps {
  /** The player being edited, or null for a new one. */
  player: AdminPlayer | null;
  nextBallNumber: number;
  onClose: () => void;
}

export function PlayerForm({ player, nextBallNumber, onClose }: PlayerFormProps) {
  const t = useTranslations("admin");
  const { pending, run } = useAdminAction();
  const [form, setForm] = useState(() => initialForm(player, nextBallNumber));
  // An existing slug is a public URL, so it only follows the name for a new player.
  const [slugTouched, setSlugTouched] = useState(player !== null);
  const [invalid, setInvalid] = useState<Set<PlayerField>>(new Set());

  const set = <K extends keyof PlayerFormState>(key: K, value: PlayerFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const error = (field: PlayerField) => (invalid.has(field) ? t(`form.errors.${field}`) : undefined);

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    const checked = validateForm(form);
    if ("fields" in checked) return setInvalid(checked.fields);
    setInvalid(new Set());
    const { input } = checked;
    const saved = await run(async () => {
      if (player) await adminApi.updatePlayer(player.id, input);
      else await adminApi.createPlayer(input);
      return t(player ? "toast.updated" : "toast.created", { name: input.name });
    });
    if (saved) onClose();
  }

  const ballNumber = Number(form.ballNumber) || 1;
  const nameError = error("name");
  const slugError = error("slug");
  const aliasesError = error("aliases");
  const numberError = error("ballNumber");
  return (
    <Sheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={t(player ? "form.editTitle" : "form.addTitle")}
      side="responsive"
    >
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <FormField id="player-avatar" label={t("form.avatar")}>
            <AvatarField
              id="player-avatar"
              value={form.avatarUrl}
              preview={{ name: form.name || "?", ballColor: form.ballColor, ballNumber }}
              onChange={(url) => set("avatarUrl", url)}
            />
          </FormField>

          <FormField id="player-name" label={t("form.name")} error={nameError}>
            <Input
              id="player-name"
              value={form.name}
              maxLength={40}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
              {...describedBy("player-name", Boolean(nameError), nameError)}
            />
          </FormField>

          <FormField id="player-slug" label={t("form.slug")} hint={t("form.slugHint")} error={slugError}>
            <Input
              id="player-slug"
              value={form.slug}
              maxLength={24}
              autoCapitalize="none"
              spellCheck={false}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              {...describedBy("player-slug", true, slugError)}
            />
          </FormField>

          <FormField id="player-nickname" label={t("form.nickname")} error={error("nickname")}>
            <Input
              id="player-nickname"
              value={form.nickname}
              maxLength={40}
              onChange={(e) => set("nickname", e.target.value)}
            />
          </FormField>

          <FormField id="player-aliases" label={t("form.aliases")} hint={t("form.aliasesHint")} error={aliasesError}>
            <Input
              id="player-aliases"
              value={form.aliases}
              onChange={(e) => set("aliases", e.target.value)}
              {...describedBy("player-aliases", true, aliasesError)}
            />
          </FormField>

          <FormField id="player-colour" label={t("form.colour")} error={error("ballColor")}>
            <ColourPicker
              id="player-colour"
              value={form.ballColor}
              ballNumber={ballNumber}
              error={error("ballColor")}
              onChange={(hex) => set("ballColor", hex)}
            />
          </FormField>

          <FormField id="player-number" label={t("form.ballNumber")} error={numberError}>
            <Input
              id="player-number"
              type="number"
              inputMode="numeric"
              min={1}
              max={15}
              value={form.ballNumber}
              onChange={(e) => set("ballNumber", e.target.value)}
              {...describedBy("player-number", Boolean(numberError), numberError)}
            />
          </FormField>

          <FormField id="player-catchphrase" label={t("form.catchphrase")} error={error("catchphrase")}>
            <Textarea
              id="player-catchphrase"
              value={form.catchphrase}
              maxLength={120}
              onChange={(e) => set("catchphrase", e.target.value)}
              className="min-h-20"
            />
          </FormField>

          <div>
            <p className="mb-1.5 text-sm font-semibold text-ivory-muted">{t("form.status")}</p>
            <Chip selected={form.active} onClick={() => set("active", !form.active)}>
              {form.active ? t("form.activeOn") : t("form.activeOff")}
            </Chip>
          </div>
        </div>

        <div className="flex gap-2 border-t border-line p-4 safe-bottom">
          <Button variant="outline" size="lg" className="flex-1" onClick={onClose} disabled={pending}>
            {t("form.cancel")}
          </Button>
          <Button type="submit" size="lg" className="flex-1" disabled={pending} aria-busy={pending}>
            {pending && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
            {pending ? t("form.saving") : t("form.save")}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
