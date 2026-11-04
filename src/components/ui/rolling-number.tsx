// Two turns of the reel, so a 0 spins as far as a 9 does.
const REEL = [..."01234567890123456789"];

/**
 * A formatted number whose digits spin into place like an LED reel. CSS only: it starts with the first paint, before
 * hydration, the server HTML already holds the real value, and it works from server and client components alike.
 */
export function RollingNumber({ value, label = value }: { value: string; label?: string }) {
  return (
    <span aria-label={label} role="img" className="inline-block whitespace-nowrap">
      {[...value].map((char, i) =>
        /\d/.test(char) ? (
          <span key={i} aria-hidden className="digit-cell">
            <span className="invisible">{char}</span>
            <span className="digit-reel" style={{ ["--digit" as string]: char, ["--order" as string]: i }}>
              {REEL.map((d, slot) => (
                <span key={slot}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden>
            {char}
          </span>
        ),
      )}
    </span>
  );
}
