export type PetFace = "open" | "happy" | "closed" | "dizzy" | "surprised";
export type PetFeet = "stand" | "stepA" | "stepB" | "tucked";
export type PetBubble = "heart" | "star" | "snore" | "alert";

export interface PetSprite {
  face: PetFace;
  feet: PetFeet;
  bubble: PetBubble | null;
  /** Body one pixel up, the bounce of a running step. */
  bob: boolean;
}

export const SPRITE_WIDTH = 18;
export const SPRITE_HEIGHT = 26;
const BODY_LEFT = 1;
const BODY_TOP = 9;
const FACE_LEFT = 5;
const FACE_TOP = 6;
const FEET_TOP = 14;
const BUBBLE_LEFT = 6;
const BUBBLE_TOP = 1;

/** A small 8-ball with feet; `.` is empty, the rest are keys of PIXEL_TOKENS. Faces right. */
const BODY = [
  ".....kkkkkk.....",
  "...kkkkkkkkkk...",
  "..kkhhkkkkkkkk..",
  ".kkhkkkkkkkkkkk.",
  ".kkkkkwwwwwwkkk.",
  "kkkkkwwwwwwwwkkk",
  "kkkkkwwwwwwwwkkk",
  "kkkkkwwwwwwwwkkk",
  "kkkkkwwwwwwwwkkk",
  ".kkkkkwwwwwwkkk.",
  ".kkkkkkkkkkkkkk.",
  "..kkkkkkkkkkkk..",
  "...kkkkkkkkkk...",
  ".....kkkkkk.....",
];

const FACES: Record<PetFace, [string, string]> = {
  open: ["wewwweww", "wewwweww"],
  happy: ["wewwweww", "ewewewew"],
  closed: ["wwwwwwww", "eeewweee"],
  dizzy: ["ewewewew", "wewwweww"],
  surprised: ["eewweeww", "eewweeww"],
};

const FEET: Record<PetFeet, [string, string]> = {
  stand: ["....ff....ff....", "....ff....ff...."],
  stepA: ["....ff....ff....", "....ff.........."],
  stepB: ["....ff....ff....", "..........ff...."],
  tucked: ["....ff....ff....", "................"],
};

const BUBBLES: Record<PetBubble, string[]> = {
  heart: [".c.c.", "ccccc", "ccccc", ".ccc.", "..c.."],
  star: ["..f..", ".fff.", "fffff", ".fff.", ".f.f."],
  snore: ["wwwww", "...w.", "..w..", ".w...", "wwwww"],
  alert: ["..c..", "..c..", "..c..", ".....", "..c.."],
};

const PIXEL_TOKENS: Record<string, string> = {
  k: "--color-eight",
  h: "--color-ivory-faint",
  w: "--color-ivory",
  e: "--color-night",
  f: "--color-lamp",
  c: "--color-loss",
  o: "--color-lamp",
};

export function readPixelColors(element: Element): Record<string, string> {
  const style = getComputedStyle(element);
  return Object.fromEntries(Object.entries(PIXEL_TOKENS).map(([key, token]) => [key, style.getPropertyValue(token)]));
}

function stamp(grid: string[][], rows: string[], left: number, top: number) {
  rows.forEach((row, y) => {
    [...row].forEach((pixel, x) => {
      const line = grid[top + y];
      if (pixel !== "." && line) line[left + x] = pixel;
    });
  });
}

/** An eight on a near-black page needs a rim, so every empty pixel touching the body takes the outline colour. */
function outline(grid: string[][]) {
  const filled = (x: number, y: number) => (grid[y]?.[x] ?? ".") !== ".";
  return grid.map((row, y) =>
    row.map((pixel, x) => {
      const touches = filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1);
      return pixel === "." && y >= BODY_TOP - 2 && touches ? "o" : pixel;
    }),
  );
}

export function drawSprite(ctx: CanvasRenderingContext2D, colors: Record<string, string>, sprite: PetSprite) {
  const grid = Array.from({ length: SPRITE_HEIGHT }, () => Array.from({ length: SPRITE_WIDTH }, () => "."));
  const top = BODY_TOP - (sprite.bob ? 1 : 0);
  stamp(grid, BODY, BODY_LEFT, top);
  stamp(grid, FACES[sprite.face], BODY_LEFT + FACE_LEFT, top + FACE_TOP);
  stamp(grid, FEET[sprite.feet], BODY_LEFT, BODY_TOP + FEET_TOP);

  ctx.clearRect(0, 0, SPRITE_WIDTH, SPRITE_HEIGHT);
  const painted = outline(grid);
  if (sprite.bubble) stamp(painted, BUBBLES[sprite.bubble], BUBBLE_LEFT, BUBBLE_TOP);
  painted.forEach((row, y) => {
    row.forEach((pixel, x) => {
      const color = colors[pixel];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    });
  });
}
