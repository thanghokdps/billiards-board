"use client";

import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion";

import { strokePath, type MatchStroke } from "../lib/match-strokes";

const MAX_PIXEL_RATIO = 2;
// Faint on purpose: page titles sit straight on this canvas and have to stay readable.
const LINE_ALPHA = 0.13;
const LINE_WIDTH = 1;
const BALL_RADIUS = 2.5;
const STROKE_MS = 1600;
/** Strokes overlap: the next one starts when this much of the last has been drawn. */
const STROKE_STAGGER = 0.3;

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Paints recent matches as ball paths behind the page, oldest first, then stops: no frames are spent once it is done. */
export function MatchArt({ strokes }: { strokes: MatchStroke[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || strokes.length === 0) return;

    const oldestFirst = [...strokes].reverse().map((stroke) => ({ stroke, points: strokePath(stroke) }));
    const lengthOf = ({ points }: (typeof oldestFirst)[number], width: number, height: number) =>
      points.reduce((sum, p, i) => {
        const prev = points[i - 1] ?? p;
        return sum + Math.hypot((p.x - prev.x) * width, (p.y - prev.y) * height);
      }, 0);

    const paint = (elapsedMs: number) => {
      const { innerWidth: width, innerHeight: height } = window;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = LINE_ALPHA;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineJoin = "round";
      oldestFirst.forEach((line, index) => {
        const progress = (elapsedMs - index * STROKE_MS * STROKE_STAGGER) / STROKE_MS;
        if (progress <= 0) return;
        const length = lengthOf(line, width, height);
        const shown = length * easeOut(Math.min(progress, 1));
        ctx.strokeStyle = line.stroke.color;
        ctx.setLineDash([shown, length]);
        ctx.beginPath();
        line.points.forEach((p) => ctx.lineTo(p.x * width, p.y * height));
        ctx.stroke();
      });
      ctx.setLineDash([]);
      for (const { stroke, points } of oldestFirst) {
        const start = points[0];
        if (!start) continue;
        ctx.fillStyle = stroke.color;
        ctx.beginPath();
        ctx.arc(start.x * width, start.y * height, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const totalMs = STROKE_MS * (1 + STROKE_STAGGER * (oldestFirst.length - 1));
    const reduced = prefersReducedMotion();
    let frame = 0;
    let startedAt = 0;
    let elapsed = reduced ? totalMs : 0;
    const tick = (now: number) => {
      startedAt ||= now;
      elapsed = now - startedAt;
      paint(elapsed);
      if (elapsed < totalMs) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint(elapsed);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reduced) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [strokes]);

  return <canvas ref={canvasRef} className="backdrop-layer" />;
}
