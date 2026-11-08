"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { Input, Label } from "@/components/ui/field";
import { formatVnd } from "@/lib/domain";
import { clack, haptic } from "@/lib/feedback";

import { MAX_BILL } from "../lib/draft";

const CHIPS = [
  { amount: 10_000, label: "10k", tone: "bg-pool-blue" },
  { amount: 50_000, label: "50k", tone: "bg-pool-red" },
  { amount: 100_000, label: "100k", tone: "bg-pool-purple" },
];
/** One disc per 10k, up to the height the scene has room for. */
const MAX_DISCS = 22;
const DISC_VND = 10_000;

interface BillChipsProps {
  bill: number | null;
  disabled: boolean;
  onAdd: (amount: number) => void;
  onSet: (bill: number | null) => void;
}

/** The bill as casino chips: each tap stacks one onto the tower, and the number stays editable. */
export function BillChips({ bill, disabled, onAdd, onSet }: BillChipsProps) {
  const t = useTranslations("submit.bill");
  const locale = useLocale();
  const discs = Math.min(MAX_DISCS, Math.ceil((bill ?? 0) / DISC_VND));

  function handleType(raw: string) {
    const digits = raw.replace(/\D/g, "");
    onSet(digits ? Math.min(MAX_BILL, Number(digits)) : null);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3">
        <div aria-hidden className="chip-scene" data-compact>
          <div className="chip-floor">
            <div
              className="chip-tower"
              style={{ ["--chip" as string]: "var(--color-lamp)", ["--t" as string]: 0 } as CSSProperties}
            >
              {Array.from({ length: discs }, (_, n) => (
                <span key={n} className="chip" style={{ ["--n" as string]: n } as CSSProperties} />
              ))}
            </div>
          </div>
        </div>
        <div role="group" aria-label={t("chips")} className="flex flex-wrap justify-center gap-2">
          {CHIPS.map(({ amount, label, tone }) => (
            <button
              key={amount}
              type="button"
              disabled={disabled || (bill ?? 0) >= MAX_BILL}
              aria-label={t("add", { amount: formatVnd(amount, locale) })}
              onClick={() => {
                clack(0.25);
                haptic();
                onAdd(amount);
              }}
              className={`digits flex size-14 cursor-pointer touch-manipulation items-center justify-center rounded-full border-4 border-dashed border-ivory/70 text-base font-bold text-ivory shadow-card transition-transform select-none hover:-translate-y-0.5 active:scale-90 disabled:opacity-40 ${tone}`}
            >
              +{label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="submit-bill">{t("label")}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="submit-bill"
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            placeholder={t("placeholder")}
            value={bill === null ? "" : String(bill)}
            onChange={(event) => handleType(event.target.value)}
          />
          <button
            type="button"
            aria-label={t("clear")}
            disabled={disabled || bill === null}
            onClick={() => onSet(null)}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line-strong text-ivory-muted transition-colors hover:bg-surface-2 hover:text-ivory disabled:opacity-40"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <p aria-live="polite" className="mt-1 text-xs text-ivory-muted">
          {bill === null ? t("none") : formatVnd(bill, locale)}
        </p>
      </div>
    </div>
  );
}
