import { cn } from "@/lib/cn";

interface BallProps {
  /** The player's ball colour (data, from the DB), or omitted for the 8-ball. */
  color?: string;
  number?: number | string;
  /** A guest's "house ball": grey body, a stripe in `color`, and a G in the disc instead of the number. */
  guest?: boolean;
  className?: string;
}

/** The stripe: the band of the circle between y = 11 and y = 29 (r = 19 around 20, 20). */
const STRIPE = "M3.27 11H36.73A19 19 0 0 1 36.73 29H3.27A19 19 0 0 1 3.27 11Z";

/** A billiard ball: colour body, ivory number disc, top-left shine. Decorative; label it at the call site. */
export function Ball({ color, number, guest, className }: BallProps) {
  const eight = !color;
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-8", className)}>
      <circle cx="20" cy="20" r="19" style={{ fill: guest ? "var(--color-house)" : (color ?? "var(--color-eight)") }} />
      {guest && (
        <path
          d={STRIPE}
          style={{ fill: color ? `color-mix(in srgb, var(--color-ivory) 40%, ${color})` : "var(--color-ivory)" }}
        />
      )}
      <circle cx="20" cy="20" r="8.6" style={{ fill: "var(--color-ivory)" }} />
      <text
        x="20"
        y="20.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="700"
        fontSize="11"
        style={{ fill: "var(--color-night)", fontFamily: "var(--font-display)" }}
      >
        {guest ? "G" : eight ? 8 : number}
      </text>
      <defs>
        {/* Identical in every ball, so a repeated id resolves to the same gradient. */}
        <radialGradient id="ball-shine" cx="32%" cy="28%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="35%" stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="black" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#ball-shine)" />
    </svg>
  );
}
