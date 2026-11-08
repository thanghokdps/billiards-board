import type { ReactNode } from "react";

const EDGES = ["left", "right", "top", "bottom"];

interface SubmitPlaqueProps {
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
}

/** The Hall of Fame brass plate, turned over by the send instead of a button. Without motion it just swaps. */
export function SubmitPlaque({ flipped, front, back }: SubmitPlaqueProps) {
  return (
    <div className="[perspective:90rem]">
      <div className="plaque" data-flipped={flipped || undefined}>
        <div className="plaque-body">
          {EDGES.map((edge) => (
            <span key={edge} aria-hidden className={`plaque-edge plaque-edge-${edge}`} />
          ))}
          <div className="plaque-face" inert={flipped}>
            {front}
          </div>
          <div className="plaque-face plaque-back" inert={!flipped}>
            {back}
          </div>
        </div>
      </div>
    </div>
  );
}
