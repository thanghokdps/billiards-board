"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type SyntheticEvent } from "react";

import { sameName } from "../lib/draft";

interface GuestChalkProps {
  /** Every name already on the table, to refuse one twice. */
  taken: string[];
  disabled: boolean;
  onAdd: (name: string) => void;
}

/** The chalk slate a guest's name is written on; it becomes a house ball marked "mới", created only on approval. */
export function GuestChalk({ taken, disabled, onAdd }: GuestChalkProps) {
  const t = useTranslations("submit.guest");
  const hintId = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();

  function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    if (!trimmed) return;
    if (taken.some((n) => sameName(n, trimmed))) return setError(t("taken"));
    setError(null);
    onAdd(trimmed);
    setName("");
  }

  return (
    <div className="chalk-slate rounded-lg border-2 border-dashed border-chalk/60 px-3 py-2">
      <form onSubmit={handleSubmit} noValidate className="flex items-center gap-2">
        <input
          value={name}
          maxLength={40}
          disabled={disabled}
          placeholder={t("placeholder")}
          aria-label={t("add")}
          aria-describedby={hintId}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          onChange={(event) => setName(event.target.value)}
          className="h-11 min-w-0 flex-1 rounded-sm border-b border-dashed border-chalk/50 bg-transparent px-1 text-lg text-chalk placeholder:text-ivory-faint focus:border-lamp focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !trimmed}
          aria-label={t("add")}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-dashed border-chalk/70 text-chalk transition-colors hover:bg-chalk/15 disabled:opacity-35"
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </form>
      <p
        id={hintId}
        role={error ? "alert" : undefined}
        className={error ? "text-sm text-loss" : "text-xs text-ivory-faint"}
      >
        {error ?? t("hint")}
      </p>
    </div>
  );
}
