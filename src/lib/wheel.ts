/**
 * Random wheel maths (requirement: probability = weight / total weight; result from
 * crypto.getRandomValues, the animation only shows it). Pure apart from the random source.
 */

export interface WheelEntry {
  id: number;
  label: string;
  color: string;
  weight: number;
  /** A guest's slice is drawn as a house ball: grey with a stripe in `color`. */
  guest?: boolean;
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

/** Admin treat: share of the draw (0 to 1) per pinned player id. Slices never show it, so it stays invisible. */
export type TreatPins = Record<number, number>;

/** Pinned players get their share; the others split the rest by weight. Falls back to weights if nothing can win. */
export function treatedChances(entries: WheelEntry[], pins: TreatPins): Map<number, number> {
  const active = activeEntries(entries);
  const pinned = active.reduce((s, e) => s + (pins[e.id] ?? 0), 0);
  const freeWeight = active.reduce((s, e) => s + (pins[e.id] === undefined ? e.weight : 0), 0);
  const rest = Math.max(0, 1 - pinned);
  const raw = active.map((e) => [e.id, pins[e.id] ?? (freeWeight ? (rest * e.weight) / freeWeight : 0)] as const);
  const total = raw.reduce((s, [, share]) => s + share, 0);
  if (!total) return probabilities(active);
  return new Map(raw.map(([id, share]) => [id, share / total]));
}

/** Pins `id` to `share`; other pins in `pool` shrink in proportion when they no longer fit in what is left. */
export function withPin(pins: TreatPins, id: number, share: number, pool: number[]): TreatPins {
  const others = pool.filter((p) => p !== id && pins[p] !== undefined);
  const sum = others.reduce((s, p) => s + pins[p]!, 0);
  const scale = sum > 1 - share ? (1 - share) / sum : 1;
  return { ...pins, ...Object.fromEntries(others.map((p) => [p, pins[p]! * scale])), [id]: share };
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

/** "xN" shortcut: everyone weighs N, a victim stays at 1 (4 players, x5 → 1/16 ≈ 6 %). */
export function applyVictim(entries: WheelEntry[], victimId: number | null, multiplier: number): WheelEntry[] {
  return entries.map((e) => ({
    ...e,
    weight: e.weight === 0 ? 0 : e.id === victimId ? 1 : multiplier,
  }));
}

export interface Slice {
  entry: WheelEntry;
  start: number;
  end: number;
  share: number;
}

/**
 * Equal slices in degrees, clockwise from 12 o'clock: an entry of weight N appears N times, the names
 * going round in order so the copies are spread out. Weights are whole numbers (chips and +/- only).
 */
export function slicesOf(entries: WheelEntry[]): Slice[] {
  const active = activeEntries(entries);
  const rounds = Math.max(0, ...active.map((e) => e.weight));
  const copies = Array.from({ length: rounds }, (_, round) => active.filter((e) => e.weight > round)).flat();
  const width = 360 / copies.length;
  return copies.map((entry, i) => ({ entry, start: i * width, end: (i + 1) * width, share: 1 / copies.length }));
}

/**
 * Final rotation so the pointer at 12 o'clock lands inside one of the winner's slices, at a random point
 * that stays clear of the slice edges; several full turns first.
 */
export function rotationFor(
  slices: Slice[],
  winnerId: number,
  current: number,
  random: () => number = cryptoRandom,
): number {
  const copies = slices.filter((s) => s.entry.id === winnerId);
  const slice = copies[Math.floor(random() * copies.length)];
  if (!slice) return current;
  const width = slice.end - slice.start;
  const inside = slice.start + width * (0.15 + random() * 0.7);
  const base = current - (current % 360);
  return base + 360 * 6 + (360 - inside);
}
