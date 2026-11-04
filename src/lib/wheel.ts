/**
 * Random wheel maths (requirement: probability = weight / total weight; result from
 * crypto.getRandomValues, the animation only shows it). Pure apart from the random source.
 */

export interface WheelEntry {
  id: number;
  label: string;
  color: string;
  weight: number;
}

/** Uniform float in [0, 1) from the Web Crypto API (53 random bits). */
export function cryptoRandom(): number {
  const words = new Uint32Array(2);
  crypto.getRandomValues(words);
  return (words[0]! * 2 ** 21 + (words[1]! >>> 11)) / 2 ** 53;
}

export function activeEntries(entries: WheelEntry[]): WheelEntry[] {
  return entries.filter((e) => e.weight > 0);
}

export function probabilities(entries: WheelEntry[]): Map<number, number> {
  const active = activeEntries(entries);
  const total = active.reduce((s, e) => s + e.weight, 0);
  return new Map(active.map((e) => [e.id, total ? e.weight / total : 0]));
}

/** Picks one entry with probability weight / total. */
export function pickWeighted(entries: WheelEntry[], random: () => number = cryptoRandom): WheelEntry | null {
  const active = activeEntries(entries);
  const total = active.reduce((s, e) => s + e.weight, 0);
  if (!total) return null;
  let point = random() * total;
  for (const entry of active) {
    point -= entry.weight;
    if (point < 0) return entry;
  }
  return active.at(-1) ?? null;
}

/** "xN" shortcut: everyone except the victim weighs N, the victim 1 (4 players, x5 → 1/16 ≈ 6 %). */
export function applyVictim(entries: WheelEntry[], victimId: number | null, multiplier: number): WheelEntry[] {
  return entries.map((e) => ({
    ...e,
    weight: e.weight === 0 ? 0 : victimId === null ? 1 : e.id === victimId ? 1 : multiplier,
  }));
}

export interface Slice {
  entry: WheelEntry;
  start: number;
  end: number;
  share: number;
}

/** Slices in degrees, clockwise from 12 o'clock. */
export function slicesOf(entries: WheelEntry[]): Slice[] {
  const active = activeEntries(entries);
  const total = active.reduce((s, e) => s + e.weight, 0);
  let angle = 0;
  return active.map((entry) => {
    const share = entry.weight / total;
    const slice = { entry, start: angle, end: angle + share * 360, share };
    angle += share * 360;
    return slice;
  });
}

/**
 * Final rotation so the pointer at 12 o'clock lands inside the winner's slice, at a random point that
 * stays clear of the slice edges; several full turns first.
 */
export function rotationFor(
  slices: Slice[],
  winnerId: number,
  current: number,
  random: () => number = cryptoRandom,
): number {
  const slice = slices.find((s) => s.entry.id === winnerId);
  if (!slice) return current;
  const width = slice.end - slice.start;
  const inside = slice.start + width * (0.15 + random() * 0.7);
  const base = current - (current % 360);
  return base + 360 * 6 + (360 - inside);
}
