import type { PoolAim } from "./pool-game";
import { BALL_RADIUS, onTable, type Ball } from "./pool-physics";

/** Numbered from 1; the 9 is the 1's colour on a striped ball. */
export const BALL_TOKENS = [
  "--color-pool-yellow",
  "--color-pool-blue",
  "--color-pool-red",
  "--color-pool-purple",
  "--color-pool-orange",
  "--color-pool-green",
  "--color-pool-maroon",
  "--color-eight",
  "--color-pool-yellow",
];

const STRIPED_ID = 9;
const CUE_LENGTH = 300;
const CUE_GAP = 8;
const CUE_MAX_DRAWBACK = 70;
const CUE_WIDTH = 7;

export interface PoolPalette {
  balls: string[];
  ivory: string;
  night: string;
  wood: string;
  lamp: string;
  numberFont: string;
}

export function readPoolPalette(canvas: HTMLCanvasElement): PoolPalette {
  const css = getComputedStyle(canvas);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    balls: BALL_TOKENS.map(token),
    ivory: token("--color-ivory"),
    night: token("--color-night"),
    wood: token("--color-wood"),
    lamp: token("--color-lamp"),
    numberFont: token("--font-display"),
  };
}

function disc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string | CanvasGradient) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawNumber(ctx: CanvasRenderingContext2D, ball: Ball, radius: number, palette: PoolPalette) {
  disc(ctx, ball.x, ball.y, radius * 0.55, palette.ivory);
  ctx.fillStyle = palette.night;
  ctx.font = `700 ${radius * 0.85}px ${palette.numberFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(ball.id), ball.x, ball.y + radius * 0.05);
}

function drawBody(ctx: CanvasRenderingContext2D, ball: Ball, radius: number, palette: PoolPalette) {
  const color = palette.balls[ball.id - 1];
  if (ball.id === 0 || !color) {
    disc(ctx, ball.x, ball.y, radius, palette.ivory);
    return;
  }
  if (ball.id !== STRIPED_ID) {
    disc(ctx, ball.x, ball.y, radius, color);
    return;
  }
  disc(ctx, ball.x, ball.y, radius, palette.ivory);
  ctx.save();
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.fillRect(ball.x - radius, ball.y - radius * 0.6, radius * 2, radius * 1.2);
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball, palette: PoolPalette) {
  const radius = onTable(ball) ? BALL_RADIUS : BALL_RADIUS * ball.sinking;
  if (radius <= 0) return;
  ctx.fillStyle = "rgb(0 0 0 / 0.35)";
  ctx.beginPath();
  ctx.ellipse(ball.x + radius * 0.25, ball.y + radius * 0.35, radius, radius * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  drawBody(ctx, ball, radius, palette);
  if (ball.id !== 0) drawNumber(ctx, ball, radius, palette);
  const shine = ctx.createRadialGradient(
    ball.x - radius * 0.35,
    ball.y - radius * 0.4,
    radius * 0.1,
    ball.x,
    ball.y,
    radius,
  );
  shine.addColorStop(0, "rgb(255 255 255 / 0.6)");
  shine.addColorStop(0.45, "rgb(255 255 255 / 0)");
  shine.addColorStop(1, "rgb(0 0 0 / 0.3)");
  disc(ctx, ball.x, ball.y, radius, shine);
}

function drawAim(ctx: CanvasRenderingContext2D, cue: Ball, aim: PoolAim, palette: PoolPalette) {
  const { direction, contact, power } = aim;
  ctx.lineCap = "round";

  ctx.strokeStyle = palette.ivory;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(cue.x, cue.y);
  ctx.lineTo(contact.x, contact.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(contact.x, contact.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const tip = BALL_RADIUS + CUE_GAP + power * CUE_MAX_DRAWBACK;
  ctx.strokeStyle = palette.wood;
  ctx.lineWidth = CUE_WIDTH;
  ctx.beginPath();
  ctx.moveTo(cue.x - direction.x * tip, cue.y - direction.y * tip);
  ctx.lineTo(cue.x - direction.x * (tip + CUE_LENGTH), cue.y - direction.y * (tip + CUE_LENGTH));
  ctx.stroke();
  ctx.strokeStyle = palette.lamp;
  ctx.beginPath();
  ctx.moveTo(cue.x - direction.x * tip, cue.y - direction.y * tip);
  ctx.lineTo(cue.x - direction.x * (tip + CUE_WIDTH), cue.y - direction.y * (tip + CUE_WIDTH));
  ctx.stroke();
  ctx.lineCap = "butt";
}

export function drawTable(
  ctx: CanvasRenderingContext2D,
  balls: Ball[],
  aim: PoolAim | null,
  cue: Ball,
  palette: PoolPalette,
) {
  for (const ball of balls) drawBall(ctx, ball, palette);
  if (aim) drawAim(ctx, cue, aim, palette);
}
