"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type SyntheticEvent } from "react";

import { useRouter } from "@/i18n/navigation";
import type { PlayerRef } from "@/server/matches/schema";

import { guestErrorKey, wheelApi } from "../api";
import { hasName } from "../lib/temp-guest";

interface GuestSlateProps {
  /** Admin saves the guest to the database; a viewer only chalks a temporary one for this browser. */
  admin: boolean;
  /** Everyone already on the wheel, to refuse a name twice. */
  taken: PlayerRef[];
  disabled: boolean;
  onAddTemp: (name: string) => void;
  /** The server saved (or already had) this guest: the page is refreshing to bring them in. */
  onSaved: (id: number) => void;
}

/** The last roster tile: a chalk slate with a dashed edge. A name and Enter put a new ball on the wheel. */
export function GuestSlate({ admin, taken, disabled, onAddTemp, onSaved }: GuestSlateProps) {
  const t = useTranslations("wheel");
  const router = useRouter();
  const hintId = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const trimmed = name.trim();

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    if (!trimmed || pending) return;
    setError(null);
    if (!admin) {
      if (hasName(taken, trimmed)) return setError(t("guestTaken"));
      onAddTemp(trimmed);
      return setName("");
    }
    setPending(true);
    try {
      const guest = await wheelApi.addGuest(trimmed);
      setName("");
      onSaved(guest.id);
      router.refresh();
    } catch (failure) {
      const key = guestErrorKey(failure);
      setError(t(key));
      if (key === "guestExpired") router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="chalk-slate col-span-full min-w-0 rounded-lg border-2 border-dashed border-chalk/60 px-3 py-2">
      <form onSubmit={handleSubmit} noValidate className="flex items-center gap-2">
        <input
          value={name}
          maxLength={40}
          disabled={disabled || pending}
          placeholder={t("guestPlaceholder")}
          aria-label={t("guestAdd")}
          aria-describedby={hintId}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          onChange={(event) => setName(event.target.value)}
          className="h-11 min-w-0 flex-1 rounded-sm border-b border-dashed border-chalk/50 bg-transparent px-1 text-lg text-chalk placeholder:text-ivory-faint focus:border-lamp focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || pending || !trimmed}
          aria-label={t("guestAdd")}
          aria-busy={pending}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed border-chalk/70 text-chalk transition-colors hover:bg-chalk/15 disabled:opacity-35"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
          ) : (
            <Plus className="size-5" aria-hidden />
          )}
        </button>
      </form>
      <p
        id={hintId}
        role={error ? "alert" : undefined}
        className={error ? "text-sm text-loss" : "text-xs text-ivory-faint"}
      >
        {error ?? t(admin ? "guestHintAdmin" : "guestHintViewer")}
      </p>
    </li>
  );
}
