import type { Slice } from "@/lib/wheel";

const R = 148;
const MIN_LABEL_SHARE = 0.012;
const REPEATED_LABEL_RADIUS = R * 0.8;

// Node and Chrome disagree on the last float digit of cos/sin, which breaks hydration; round SVG coordinates.
const round = (n: number) => Math.round(n * 100) / 100;

/** Fits a repeated name to its slice's width at the label radius, so ×10 stays readable on a 375 px phone. */
function repeatedLabelSize(share: number): number {
  const sliceWidth = 2 * Math.PI * REPEATED_LABEL_RADIUS * share;
  return round(Math.min(17, Math.max(11, sliceWidth * 0.9)));
}

function arcPath(slice: Slice): string {
  if (slice.share >= 0.9999) return `M 0 ${-R} A ${R} ${R} 0 1 1 -0.01 ${-R} Z`;
  const toXY = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [round(R * Math.cos(rad)), round(R * Math.sin(rad))] as const;
  };
  const [x1, y1] = toXY(slice.start);
  const [x2, y2] = toXY(slice.end);
  const large = slice.end - slice.start > 180 ? 1 : 0;
  return `M 0 0 L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
}

/** A guest's stripe: the rim band of the slice, like the 3D wheel's. Skipped for a full circle (one entry). */
function stripePath(slice: Slice): string | null {
  if (slice.share >= 0.9999) return null;
  const at = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${round(radius * Math.cos(rad))} ${round(radius * Math.sin(rad))}`;
  };
  const [outer, inner] = [R * 0.93, R * 0.8];
  const large = slice.end - slice.start > 180 ? 1 : 0;
  return `M ${at(slice.start, outer)} A ${outer} ${outer} 0 ${large} 1 ${at(slice.end, outer)} L ${at(slice.end, inner)} A ${inner} ${inner} 0 ${large} 0 ${at(slice.start, inner)} Z`;
}

function labelAt(slice: Slice, radius: number) {
  const mid = (slice.start + slice.end) / 2;
  const rad = ((mid - 90) * Math.PI) / 180;
  return { x: round(radius * Math.cos(rad)), y: round(radius * Math.sin(rad)), rotate: round(mid) };
}

interface FlatWheelProps {
  slices: Slice[];
  /** Names repeat, so slices are too thin for sideways text. */
  repeated: boolean;
  label: string;
  rotation: number;
  /** CSS transition time; `null` while the 3D wheel drives the spin. */
  durationMs: number | null;
  onSpinEnd: () => void;
}

/** The felt table seen from above: one slice per player in their ball colour, the cue tip as pointer. */
export function FlatWheel({ slices, repeated, label, rotation, durationMs, onSpinEnd }: FlatWheelProps) {
  return (
    <div className="relative size-full">
      {/* Cue tip pointer at 12 o'clock */}
      <div aria-hidden className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
        <svg viewBox="0 0 24 56" className="h-12 w-6 drop-shadow-lg">
          <rect x="8" y="0" width="8" height="36" rx="2" style={{ fill: "var(--color-ivory-muted)" }} />
          <rect x="8" y="30" width="8" height="8" style={{ fill: "var(--color-cold)" }} />
          <path d="M8 38 L16 38 L12 54 Z" style={{ fill: "var(--color-lamp)" }} />
        </svg>
      </div>
      <svg viewBox="-160 -160 320 320" className="size-full" role="img" aria-label={label}>
        {/* Rail and pockets */}
        <circle r="158" style={{ fill: "var(--color-wood)" }} />
        <circle r="152" style={{ fill: "var(--color-felt-deep)" }} />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <circle
            key={deg}
            r="4"
            cx={round(155 * Math.cos((deg * Math.PI) / 180))}
            cy={round(155 * Math.sin((deg * Math.PI) / 180))}
            style={{ fill: "var(--color-night)" }}
          />
        ))}
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: durationMs === null ? "none" : `transform ${durationMs}ms cubic-bezier(0.12, 0.7, 0.1, 1)`,
          }}
          onTransitionEnd={durationMs === null ? undefined : onSpinEnd}
        >
          {slices.map((slice) => {
            const at = labelAt(slice, repeated ? REPEATED_LABEL_RADIUS : R * 0.7);
            const stripe = slice.entry.guest ? stripePath(slice) : null;
            return (
              <g key={slice.start}>
                <path
                  d={arcPath(slice)}
                  style={{
                    fill: slice.entry.guest ? "var(--color-house)" : slice.entry.color,
                    stroke: "var(--color-felt-deep)",
                    strokeWidth: 2,
                  }}
                />
                {stripe && (
                  <path
                    d={stripe}
                    style={{ fill: `color-mix(in srgb, var(--color-ivory) 40%, ${slice.entry.color})` }}
                  />
                )}
                {slice.share > MIN_LABEL_SHARE && (
                  <text
                    x={at.x}
                    y={at.y}
                    transform={`rotate(${repeated ? at.rotate - 90 : at.rotate} ${at.x} ${at.y})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontWeight="800"
                    fontSize={repeated ? repeatedLabelSize(slice.share) : slice.share > 0.12 ? 18 : 14}
                    style={{ fill: "var(--color-night)", fontFamily: "var(--font-display)" }}
                  >
                    {slice.entry.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        {/* Centre spot */}
        <circle r="22" style={{ fill: "var(--color-felt)", stroke: "var(--color-felt-deep)", strokeWidth: 4 }} />
        <circle r="7" style={{ fill: "var(--color-ivory)" }} />
      </svg>
    </div>
  );
}
