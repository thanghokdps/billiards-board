"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import { Ball } from "@/components/ui/ball";
import { Button } from "@/components/ui/button";
import { prefersReducedMotion } from "@/lib/motion";

import { TableFrame } from "./table-frame";
import { BALL_TOKENS, drawTable, readPoolPalette } from "../lib/pool-draw";
import { PoolRound, type PoolHud } from "../lib/pool-game";
import { FIXED_STEP_MS, onTable, TABLE_HEIGHT, TABLE_WIDTH } from "../lib/pool-physics";

const PLAYED_KEY = "an-bill:home:break-played";
const MAX_CATCH_UP_MS = 50;
const BREAK_DELAY_MS = 500;
const EIGHT_BALL_ID = 8;

/** sessionStorage throws when blocked; a blocked visitor just sees the break on every visit. */
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

/** The table you can play: it breaks once per session, then the cue ball is yours to drag and shoot. */
export function PoolGame() {
  const t = useTranslations("home.pool");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<HTMLSpanElement>(null);
  const roundRef = useRef<PoolRound | null>(null);
  const kickRef = useRef<() => void>(() => undefined);
  const [hud, setHud] = useState<PoolHud>({ phase: "aim", shots: 0, sunk: [] });

  useEffect(() => {
    const canvas = canvasRef.current;
    const handle = handleRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !handle || !ctx) return;

    const round = new PoolRound(setHud);
    roundRef.current = round;
    const palette = readPoolPalette(canvas);

    const paint = () => {
      const width = canvas.clientWidth;
      const scale = (width / TABLE_WIDTH) * Math.min(window.devicePixelRatio, 2);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
      drawTable(ctx, round.balls, round.aim, round.cue, palette);
      handle.hidden = round.phase === "moving" || round.phase === "cleared" || !onTable(round.cue);
      const toPixels = width / TABLE_WIDTH;
      handle.style.transform = `translate(${round.cue.x * toPixels}px, ${round.cue.y * toPixels}px)`;
    };

    const fitCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.clientWidth * pixelRatio;
      canvas.height = canvas.clientHeight * pixelRatio;
      paint();
    };

    // Idle tables draw nothing: the loop runs only while balls roll.
    let frame = 0;
    let last = 0;
    let debt = 0;
    const loop = (now: number) => {
      debt += Math.min(now - last, MAX_CATCH_UP_MS);
      last = now;
      for (; debt >= FIXED_STEP_MS; debt -= FIXED_STEP_MS) round.step();
      paint();
      frame = round.phase === "moving" ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (frame) return;
      if (round.phase !== "moving") {
        paint();
        return;
      }
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    kickRef.current = kick;

    const resizes = new ResizeObserver(fitCanvas);
    resizes.observe(canvas);
    fitCanvas();

    let breakTimer = 0;
    if (!prefersReducedMotion() && !playedThisSession()) {
      breakTimer = window.setTimeout(() => {
        markPlayed();
        round.breakShot();
        kick();
      }, BREAK_DELAY_MS);
    }

    return () => {
      clearTimeout(breakTimer);
      cancelAnimationFrame(frame);
      resizes.disconnect();
      roundRef.current = null;
    };
  }, []);

  const tableSpot = (e: PointerEvent) => {
    const box = canvasRef.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return {
      x: ((e.clientX - box.left) / box.width) * TABLE_WIDTH,
      y: ((e.clientY - box.top) / box.height) * TABLE_HEIGHT,
    };
  };

  const onPointerDown = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    const round = roundRef.current;
    if (!round || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    if (round.phase === "hand") round.placeCue(tableSpot(e));
    else round.pullTo(tableSpot(e));
    kickRef.current();
  };

  const onPointerUp = () => {
    const round = roundRef.current;
    if (!round) return;
    if (round.phase === "hand") round.placed();
    else round.release();
    kickRef.current();
  };

  const onPointerCancel = () => {
    roundRef.current?.cancel();
    kickRef.current();
  };

  const rerack = () => {
    roundRef.current?.rerack();
    kickRef.current();
  };

  return (
    <div className="min-w-0 space-y-2">
      <TableFrame>
        <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 size-full" />
        <span
          ref={handleRef}
          aria-hidden
          className="pool-cue-handle"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />
      </TableFrame>
      <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1">
        <p role="status" className="min-w-0 flex-1 text-xs text-ivory-muted">
          {hud.phase === "cleared"
            ? t("cleared", { count: hud.shots })
            : hud.phase === "hand"
              ? t("scratch")
              : t("hint")}
        </p>
        {hud.sunk.length > 0 && (
          <ul aria-label={t("sunk")} className="flex items-center gap-0.5">
            {hud.sunk.map((id) => (
              <li key={id}>
                <Ball
                  number={id}
                  color={id === EIGHT_BALL_ID ? undefined : `var(${BALL_TOKENS[id - 1]})`}
                  className="size-5"
                />
              </li>
            ))}
          </ul>
        )}
        <span className="digits text-xs text-ivory-muted">{t("shots", { count: hud.shots })}</span>
        <Button variant="ghost" size="sm" onClick={rerack}>
          {t("rerack")}
        </Button>
      </div>
    </div>
  );
}
