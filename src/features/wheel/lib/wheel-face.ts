import { CanvasTexture, SRGBColorSpace } from "three";

import type { Slice } from "@/lib/wheel";

export const FACE_SIZE = 1536;

/** Below this share a sideways name no longer fits, so it reads along the radius. */
const SIDEWAYS_SHARE = 0.1;
const SIDEWAYS_RADIUS = 0.68;
const RADIAL_RADIUS = 0.62;
const MAX_FONT = 118;
const MIN_FONT = 30;

/** Perceived brightness of `#rrggbb`, enough to choose ink for a slice. */
function isLight(hex: string): boolean {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return true;
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 140;
}

function fitFont(ctx: CanvasRenderingContext2D, label: string, font: string, room: number, cap: number): number {
  ctx.font = `800 ${cap}px ${font}`;
  const width = ctx.measureText(label).width;
  return Math.max(MIN_FONT, Math.min(cap, Math.floor((cap * room) / width)));
}

function paintSlice(ctx: CanvasRenderingContext2D, slice: Slice, radius: number, font: string) {
  const startRad = ((slice.start - 90) * Math.PI) / 180;
  const endRad = ((slice.end - 90) * Math.PI) / 180;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, startRad, endRad);
  ctx.closePath();
  const shade = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
  shade.addColorStop(0, "rgb(0 0 0 / 0.42)");
  shade.addColorStop(0.55, "rgb(0 0 0 / 0.04)");
  shade.addColorStop(1, "rgb(255 255 255 / 0.2)");
  ctx.fillStyle = slice.entry.color;
  ctx.fill();
  ctx.fillStyle = shade;
  ctx.fill();

  const sideways = slice.share >= SIDEWAYS_SHARE;
  const mid = (slice.start + slice.end) / 2;
  const at = radius * (sideways ? SIDEWAYS_RADIUS : RADIAL_RADIUS);
  const room = sideways ? 2 * Math.PI * at * slice.share * 0.82 : radius * 0.6;
  const cap = sideways ? MAX_FONT : Math.min(MAX_FONT, 2 * Math.PI * at * slice.share * 0.8);
  ctx.save();
  ctx.rotate((mid * Math.PI) / 180);
  ctx.translate(0, -at);
  if (!sideways) ctx.rotate(Math.PI / 2);
  ctx.font = `800 ${fitFont(ctx, slice.entry.label, font, room, cap)}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = isLight(slice.entry.color) ? "#0b1410" : "#f3eedc";
  ctx.fillText(slice.entry.label, 0, 0);
  ctx.restore();
}

/** One texture for the whole wheel: wedges read it by their own x, y, so it maps 1:1 onto the face. */
export function faceTexture(slices: Slice[], font: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = FACE_SIZE;
  canvas.height = FACE_SIZE;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.translate(FACE_SIZE / 2, FACE_SIZE / 2);
    for (const slice of slices) paintSlice(ctx, slice, FACE_SIZE / 2, font);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** The hub's eight ball, unwrapped for a sphere: the 2:1 canvas makes the circle an ellipse. */
export function eightBallTexture(night: string, ivory: string, font: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = night;
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = ivory;
    ctx.beginPath();
    ctx.ellipse(256, 128, 74, 60, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = night;
    ctx.font = `800 96px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("8", 256, 134);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
