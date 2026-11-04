"use client";

import { Chip } from "@/components/ui/chip";
import type { Side } from "@/lib/domain";

interface SideToggleProps {
  value: Side | null;
  onChange: (next: Side | null) => void;
  labelA: string;
  labelB: string;
  /** A second tap on the chosen side clears it (team picking). Votes cannot be unset, so they leave this off. */
  clearable?: boolean;
  disabled?: { a?: boolean; b?: boolean };
}

/** Two chips, "A" or "B", for one player. */
export function SideToggle({ value, onChange, labelA, labelB, clearable, disabled }: SideToggleProps) {
  const pick = (side: Side) => onChange(value === side ? (clearable ? null : side) : side);
  return (
    <div className="flex min-w-0 gap-2">
      <Chip selected={value === "a"} disabled={disabled?.a} onClick={() => pick("a")} className="min-w-0 max-w-40">
        <span className="truncate">{labelA}</span>
      </Chip>
      <Chip selected={value === "b"} disabled={disabled?.b} onClick={() => pick("b")} className="min-w-0 max-w-40">
        <span className="truncate">{labelB}</span>
      </Chip>
    </div>
  );
}
