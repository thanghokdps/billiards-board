import { useTranslations } from "next-intl";

import { Ball } from "@/components/ui/ball";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";

import { describedBy } from "./form-field";
import { BALL_PALETTE } from "../lib/palette";
import { isValidColour } from "../lib/player-form";

interface ColourPickerProps {
  id: string;
  value: string;
  ballNumber: number;
  error?: string;
  onChange: (hex: string) => void;
}

/** The five regulars' ball colours as swatches, plus a free `#RRGGBB` field checked with the server's rule. */
export function ColourPicker({ id, value, ballNumber, error, onChange }: ColourPickerProps) {
  const t = useTranslations("admin.form");
  const valid = isValidColour(value);
  return (
    <div className="space-y-3">
      <div role="group" aria-label={t("colour")} className="flex flex-wrap gap-2">
        {BALL_PALETTE.map(({ key, hex }) => {
          const selected = value.trim().toLowerCase() === hex.toLowerCase();
          return (
            <Button
              key={key}
              variant="ghost"
              size="icon"
              aria-label={t(`colours.${key}`)}
              aria-pressed={selected}
              onClick={() => onChange(hex)}
              className={cn("p-1", selected && "ring-2 ring-lamp ring-offset-2 ring-offset-surface")}
            >
              <Ball color={hex} number={ballNumber} className="size-full" />
            </Button>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <Ball color={valid ? value.trim() : undefined} number={ballNumber} className="size-11" />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          maxLength={7}
          spellCheck={false}
          autoCapitalize="none"
          aria-label={t("colourCustom")}
          className="font-mono"
          {...describedBy(id, Boolean(error), error)}
        />
      </div>
    </div>
  );
}
