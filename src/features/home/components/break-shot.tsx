"use client";

import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion";

import { FIXED_STEP_MS, rackUp, stepTable, type Disc } from "../lib/break-physics";

const PLAYED_KEY = "an-bill:home:break-played";
const POOL_COLORS = ["yellow", "blue", "red", "purple", "orange", "green"];
const MAX_MS = 2600;
const FADE_MS = 500;
const MAX_CATCH_UP_MS = 50;

/** sessionStorage throws when blocked; a blocked visitor just sees the shot on every visit. */
function playedThisSession(): boolean {
  try {
    return sessionStorage.getItem(PLAYED_KEY) !== null;
  } catch {
    return false;
  }
}

function markPlayed() {
  try {
    sessionStorage.setItem(PLAYED_KEY, "1");
  } catch {
    // Blocked storage: nothing to remember, see playedThisSession.
  }
}

function drawDisc(ctx: CanvasRenderingContext2D, { x, y, color }: Disc, radius: number) {
  ctx.fillStyle = "rgb(0 0 0 / 0.35)";
  ctx.beginPath();
  ctx.ellipse(x + radius * 0.25, y + radius * 0.35, radius, radius * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  const shine = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.1, x, y, radius);
  shine.addColorStop(0, "rgb(255 255 255 / 0.65)");
  shine.addColorStop(0.45, "rgb(255 255 255 / 0)");
  shine.addColorStop(1, "rgb(0 0 0 / 0.35)");
  for (const fill of [color, shine]) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The day opens with a break across the felt: real collisions, once per browser session, then the balls fade away. */
export function BreakShot() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || prefersReducedMotion() || playedThisSession()) return;

    const { clientWidth: width, clientHeight: height } = canvas;
    const scale = Math.min(window.devicePixelRatio, 2);
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    const css = getComputedStyle(canvas);
    const colors = POOL_COLORS.map((name) => css.getPropertyValue(`--color-pool-${name}`).trim());
    const radius = Math.max(8, Math.min(width, height) * 0.03);
    const discs = rackUp(width, height, radius, css.getPropertyValue("--color-ivory").trim(), colors);

    let frame = 0;
    const startedAt = performance.now();
    let last = startedAt;
    let debt = 0;

    const loop = (now: number) => {
      // On the first frame, not in the effect: Strict Mode runs the effect twice and cancels the first run.
      if (now - startedAt < MAX_CATCH_UP_MS) markPlayed();
      debt += Math.min(now - last, MAX_CATCH_UP_MS);
      last = now;
      for (; debt >= FIXED_STEP_MS; debt -= FIXED_STEP_MS) stepTable(discs, width, height, radius);
      const opacity = 1 - (now - startedAt - MAX_MS) / FADE_MS;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = Math.min(1, Math.max(0, opacity));
      for (const disc of discs) drawDisc(ctx, disc, radius);
      if (opacity > 0) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 size-full" />;
}
