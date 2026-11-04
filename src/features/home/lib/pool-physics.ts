export interface Ball {
  /** 0 is the cue ball; 1 to 9 are the object balls. */
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Where it dropped, or null while on the table. */
  pocket: Point | null;
  /** Left of the drop animation, from 1 down to 0. */
  sinking: number;
}

export interface Point {
  x: number;
  y: number;
}

export const FIXED_STEP_MS = 1000 / 120;
// The table is simulated at one fixed size, so resizing the page never moves a ball.
export const TABLE_WIDTH = 1000;
export const TABLE_HEIGHT = 500;
// Larger than to scale: a true ball is about 3 px across on a phone-width table.
export const BALL_RADIUS = 16;
export const CUE_SPOT: Point = { x: 250, y: TABLE_HEIGHT / 2 };
// A step must stay shorter than a ball's width, or a fast ball passes through another.
export const MAX_BALL_SPEED = 2 * BALL_RADIUS * 0.75;

const FRICTION = 0.9925;
const WALL_BOUNCE = 0.82;
const STOP_SPEED = 0.04;
const SINK_STEPS = 24;
const SINK_PULL = 0.14;
const RACK_APEX_X = 700;
const RACK_ROWS = [1, 2, 3, 2, 1];
const RACK_GAP = 0.5;
const CORNER_POCKET_REACH = 30;
const SIDE_POCKET_REACH = 26;
const POCKETS = [
  { x: 0, y: 0, reach: CORNER_POCKET_REACH },
  { x: TABLE_WIDTH / 2, y: 0, reach: SIDE_POCKET_REACH },
  { x: TABLE_WIDTH, y: 0, reach: CORNER_POCKET_REACH },
  { x: 0, y: TABLE_HEIGHT, reach: CORNER_POCKET_REACH },
  { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT, reach: SIDE_POCKET_REACH },
  { x: TABLE_WIDTH, y: TABLE_HEIGHT, reach: CORNER_POCKET_REACH },
];

export const onTable = (ball: Ball) => ball.pocket === null;

function bounceOffWalls(ball: Ball) {
  const { x, y } = ball;
  ball.x = Math.min(TABLE_WIDTH - BALL_RADIUS, Math.max(BALL_RADIUS, x));
  ball.y = Math.min(TABLE_HEIGHT - BALL_RADIUS, Math.max(BALL_RADIUS, y));
  if (ball.x !== x) ball.vx *= -WALL_BOUNCE;
  if (ball.y !== y) ball.vy *= -WALL_BOUNCE;
}

/** Equal masses, so an elastic hit swaps the velocity components along the line between the two centres. */
function collide(a: Ball, b: Ball) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || distance >= BALL_RADIUS * 2) return;
  const nx = dx / distance;
  const ny = dy / distance;
  const overlap = (BALL_RADIUS * 2 - distance) / 2;
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

function dropIntoPocket(ball: Ball) {
  const pocket = POCKETS.find(({ x, y, reach }) => Math.hypot(ball.x - x, ball.y - y) < reach);
  if (!pocket) return false;
  ball.pocket = { x: pocket.x, y: pocket.y };
  ball.sinking = 1;
  ball.vx = 0;
  ball.vy = 0;
  return true;
}

function sink(ball: Ball) {
  if (!ball.pocket || ball.sinking <= 0) return;
  ball.x += (ball.pocket.x - ball.x) * SINK_PULL;
  ball.y += (ball.pocket.y - ball.y) * SINK_PULL;
  ball.sinking = Math.max(0, ball.sinking - 1 / SINK_STEPS);
}

/** One fixed step of the table. Returns the balls that dropped during it. */
export function stepTable(balls: Ball[]): Ball[] {
  const dropped: Ball[] = [];
  for (const ball of balls) {
    sink(ball);
    if (!onTable(ball)) continue;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;
    if (Math.hypot(ball.vx, ball.vy) < STOP_SPEED) ball.vx = ball.vy = 0;
    // Before the walls, which would otherwise push a ball back out of the pocket's mouth.
    if (dropIntoPocket(ball)) dropped.push(ball);
    else bounceOffWalls(ball);
  }
  const rolling = balls.filter(onTable);
  for (let i = 0; i < rolling.length; i++) {
    for (let j = i + 1; j < rolling.length; j++) {
      const [a, b] = [rolling[i], rolling[j]];
      if (a && b) collide(a, b);
    }
  }
  return dropped;
}

export function isSettled(balls: Ball[]) {
  return balls.every((ball) => ball.sinking <= 0 && ball.vx === 0 && ball.vy === 0);
}

const restingBall = (id: number, { x, y }: Point): Ball => ({ id, x, y, vx: 0, vy: 0, pocket: null, sinking: 0 });

function shuffled(values: number[]) {
  const deck = [...values];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j] as number, deck[i] as number];
  }
  return deck;
}

/** A nine-ball diamond: the 1 at the apex, the 9 in the middle, the rest in any order. */
export function rackNine(): Ball[] {
  const others = shuffled([2, 3, 4, 5, 6, 7, 8]);
  const rowStep = (BALL_RADIUS * 2 + RACK_GAP) * (Math.sqrt(3) / 2);
  const rack = RACK_ROWS.flatMap((count, row) =>
    Array.from({ length: count }, (_, slot) => {
      const at = {
        x: RACK_APEX_X + row * rowStep,
        y: TABLE_HEIGHT / 2 + (slot - (count - 1) / 2) * (BALL_RADIUS * 2 + RACK_GAP),
      };
      const isApex = row === 0;
      const isMiddle = row === 2 && slot === 1;
      return restingBall(isApex ? 1 : isMiddle ? 9 : (others.pop() ?? 0), at);
    }),
  );
  return [restingBall(0, CUE_SPOT), ...rack];
}

/** Where a shot from `from` along the unit vector `direction` first stops: the first ball it meets, or a wall. */
export function firstContact(balls: Ball[], from: Ball, direction: Point): Point {
  const reachWall = (position: number, heading: number, size: number) => {
    if (heading === 0) return Infinity;
    return ((heading > 0 ? size - BALL_RADIUS : BALL_RADIUS) - position) / heading;
  };
  let nearest = Math.min(reachWall(from.x, direction.x, TABLE_WIDTH), reachWall(from.y, direction.y, TABLE_HEIGHT));
  for (const ball of balls) {
    if (ball === from || !onTable(ball)) continue;
    const toBallX = ball.x - from.x;
    const toBallY = ball.y - from.y;
    const along = toBallX * direction.x + toBallY * direction.y;
    const offLine = Math.hypot(toBallX, toBallY) ** 2 - along ** 2;
    const reach = (BALL_RADIUS * 2) ** 2 - offLine;
    if (along <= 0 || reach < 0) continue;
    nearest = Math.min(nearest, along - Math.sqrt(reach));
  }
  return { x: from.x + direction.x * nearest, y: from.y + direction.y * nearest };
}
