"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { PAIRING_FORMATS, type PairingFormat } from "@/lib/domain";

const LABELS = { "1v1": "mode1v1", "2v2": "mode2v2", "1v1v1": "mode1v1v1" } as const;
/** Seat dots per side, so the format reads at a glance. */
const SIDES: Record<PairingFormat, number[]> = { "1v1": [1, 1], "2v2": [2, 2], "1v1v1": [1, 1, 1] };

interface ModePickerProps {
  mode: PairingFormat;
  disabled: boolean;
  hint: string;
  onChange: (mode: PairingFormat) => void;
}

/** A sliding plate over three formats, each with its seats drawn as balls. */
export function ModePicker({ mode, disabled, hint, onChange }: ModePickerProps) {
  const t = useTranslations("wheel");
  return (
    <div className="space-y-2">
      <div role="group" aria-label={t("modeTitle")} className="grid grid-cols-3 gap-1 rounded-lg bg-surface-2 p-1">
        {PAIRING_FORMATS.map((m) => {
          const selected = mode === m;
          return (
            <button
              key={m}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(m)}
              className="relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 disabled:cursor-not-allowed"
            >
              {selected && (
                <motion.span
                  layoutId="wheel-mode-plate"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-md bg-lamp shadow-lamp"
                />
              )}
              <span
                className={cn("digits relative text-xl font-bold leading-none", selected ? "text-night" : "text-ivory")}
              >
                {t(LABELS[m])}
              </span>
              <span aria-hidden className="relative flex items-center gap-1.5">
                {SIDES[m].map((dots, side) => (
                  <span key={side} className="flex gap-0.5">
                    {Array.from({ length: dots }, (_, dot) => (
                      <span
                        key={dot}
                        className={cn("size-1.5 rounded-full", selected ? "bg-night" : "bg-ivory-faint")}
                      />
                    ))}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-ivory-muted">{hint}</p>
    </div>
  );
}
