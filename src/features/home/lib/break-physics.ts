export interface Disc {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export const FIXED_STEP_MS = 1000 / 120;

const FRICTION = 0.9965;
const WALL_BOUNCE = 0.82;

function bounceOffWalls(d: Disc, width: number, height: number, radius: number) {
  if (d.x < radius || d.x > width - radius) {
    d.x = Math.min(width - radius, Math.max(radius, d.x));
    d.vx *= -WALL_BOUNCE;
  }
  if (d.y < radius || d.y > height - radius) {
    d.y = Math.min(height - radius, Math.max(radius, d.y));
    d.vy *= -WALL_BOUNCE;
  }
}

/** Equal masses, so an elastic hit swaps the velocity components along the line between the two centres. */
function collide(a: Disc, b: Disc, radius: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || distance >= radius * 2) return;
  const nx = dx / distance;
  const ny = dy / distance;
  const overlap = (radius * 2 - distance) / 2;
  a.x -= nx * overlap;
  a.y -= ny * overlap;
  b.x += nx * overlap;
  b.y += ny * overlap;
  const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (closing <= 0) return;
  a.vx -= closing * nx;
  a.vy -= closing * ny;
  b.vx += closing * nx;
  b.vy += closing * ny;
}

/** One fixed step of the table. */
export function stepTable(discs: Disc[], width: number, height: number, radius: number) {
  for (const d of discs) {
    d.x += d.vx;
    d.y += d.vy;
    d.vx *= FRICTION;
    d.vy *= FRICTION;
    bounceOffWalls(d, width, height, radius);
  }
  for (let i = 0; i < discs.length; i++) {
    for (let j = i + 1; j < discs.length; j++) {
      const [a, b] = [discs[i], discs[j]];
      if (a && b) collide(a, b, radius);
    }
  }
}

/** A cue ball on the left aimed at a triangle of `colors` on the right, one more ball per row. */
export function rackUp(width: number, height: number, radius: number, cue: string, colors: string[]): Disc[] {
  const apexX = width * 0.58;
  const rowGap = radius * 1.75;
  const discs: Disc[] = colors.map((color, i) => {
    const row = Math.floor((Math.sqrt(8 * i + 1) - 1) / 2);
    const inRow = i - (row * (row + 1)) / 2;
    return {
      x: apexX + row * rowGap,
      y: height / 2 + (inRow - row / 2) * radius * 2.05,
      vx: 0,
      vy: 0,
      color,
    };
  });
  const speed = width / 90;
  return [{ x: radius * 2, y: height / 2 + radius * 0.3, vx: speed, vy: 0, color: cue }, ...discs];
}
