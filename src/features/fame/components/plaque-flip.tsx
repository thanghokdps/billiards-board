"use client";

import { RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

const EDGES = ["left", "right", "top", "bottom"];

interface PlaqueFlipProps {
  front: ReactNode;
  /** The match behind the record. A record with no match has nothing to turn over to. */
  back?: ReactNode;
}

/** A brass plate with real thickness. Flipping keeps working under reduced motion, it just turns instantly. */
export function PlaqueFlip({ front, back }: PlaqueFlipProps) {
  const t = useTranslations("fame.plaque");
  const [flipped, setFlipped] = useState(false);
  const flipLabel = flipped ? t("showRecord") : t("showMatch");
  const flip = (
    <button
      type="button"
      aria-label={flipLabel}
      onClick={() => setFlipped(!flipped)}
      className="absolute inset-0 flex cursor-pointer items-start justify-end rounded-xl p-3 text-lamp"
    >
      <RotateCw className="size-4" aria-hidden />
    </button>
  );

  return (
    <div className="plaque" data-flipped={flipped || undefined}>
      <div className="plaque-body">
        {EDGES.map((edge) => (
          <span key={edge} aria-hidden className={`plaque-edge plaque-edge-${edge}`} />
        ))}
        <div className="plaque-face" inert={flipped}>
          {front}
          {back !== undefined && flip}
        </div>
        {back !== undefined && (
          <div className="plaque-face plaque-back" inert={!flipped}>
            {back}
            {flip}
          </div>
        )}
      </div>
    </div>
  );
}
