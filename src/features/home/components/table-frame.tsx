import type { ReactNode } from "react";

// Sights sit at quarters of each half of a long rail and of the whole short rail, as on a real pool table.
const LONG_RAIL_SIGHTS = [12.5, 25, 37.5, 62.5, 75, 87.5];
const SHORT_RAIL_SIGHTS = [25, 50, 75];
const CUSHIONS = ["top-left", "top-right", "bottom-left", "bottom-right", "left", "right"];
const POCKETS = ["top-left", "top-side", "top-right", "bottom-left", "bottom-side", "bottom-right"];

const sights = (rail: string, positions: number[]) =>
  positions.map((at) => (
    <span key={`${rail}-${at}`} className={`pool-sight pool-sight-${rail}`} style={{ ["--at" as string]: `${at}%` }} />
  ));

/** A pocket table from above: wood rail with diamond sights, six cushions cut at the jaws, six pockets. */
export function TableFrame({ labelledBy, children }: { labelledBy: string; children: ReactNode }) {
  return (
    <section aria-labelledby={labelledBy} className="pool-table">
      <div aria-hidden className="pool-cloth felt animate-lamp-on" />
      <div aria-hidden className="pool-furniture">
        {CUSHIONS.map((side) => (
          <span key={side} className={`pool-cushion pool-cushion-${side}`} />
        ))}
        {sights("top", LONG_RAIL_SIGHTS)}
        {sights("bottom", LONG_RAIL_SIGHTS)}
        {sights("left", SHORT_RAIL_SIGHTS)}
        {sights("right", SHORT_RAIL_SIGHTS)}
      </div>
      {POCKETS.map((spot) => (
        <span key={spot} aria-hidden className={`pool-pocket pool-pocket-${spot}`} />
      ))}
      <div className="pool-field relative">{children}</div>
    </section>
  );
}
