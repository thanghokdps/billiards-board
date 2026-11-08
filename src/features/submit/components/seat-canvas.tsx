"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";
import type { Point, SceneBall, TableScene } from "@/lib/table-3d/table-scene";

import { CUE_PATH } from "../lib/table-balls";

export interface SeatSceneBall {
  id: number;
  color: string;
  number: number | string;
  /** A house ball: grey body and a G, like a guest's avatar. */
  guest: boolean;
  point: Point;
  delayMs: number;
}

interface SeatCanvasProps {
  balls: SeatSceneBall[];
  /** Counts up on each send; a new value fires the cue ball. */
  strike: number;
  live: boolean;
  onLiveChange: (live: boolean) => void;
}

const LOAD_AHEAD = "400px";

function toScene(canvas: HTMLCanvasElement, balls: SeatSceneBall[]): SceneBall[] {
  const house = getComputedStyle(canvas).getPropertyValue("--color-house").trim();
  return balls.map(({ guest, color, number, ...ball }) => ({
    ...ball,
    color: guest ? house : color,
    number: guest ? "G" : number,
  }));
}

/**
 * The table in WebGL over the flat one. three.js is imported only once the canvas is on screen, and reduced motion or
 * any failure (no WebGL, chunk blocked, context lost) leaves the flat table, which does everything on its own.
 */
export function SeatCanvas({ balls, strike, live, onLiveChange }: SeatCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<TableScene | null>(null);
  const latest = useRef(balls);
  const struck = useRef(strike);
  const [near, setNear] = useState(false);

  useEffect(() => {
    latest.current = balls;
  }, [balls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: LOAD_AHEAD },
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.parentElement;
    if (!canvas || !root || !near) return;
    let cancelled = false;
    let scene: TableScene | null = null;
    let sizes: ResizeObserver | null = null;
    const onLost = () => onLiveChange(false);

    import("@/lib/table-3d/table-scene")
      .then(({ TableScene: Scene }) => {
        if (cancelled) return;
        const created = new Scene(canvas, root, "tall", CUE_PATH);
        scene = created;
        sceneRef.current = created;
        created.resize(canvas.clientWidth, canvas.clientHeight);
        sizes = new ResizeObserver(() => created.resize(canvas.clientWidth, canvas.clientHeight));
        sizes.observe(canvas);
        created.update(toScene(canvas, latest.current), false);
        canvas.addEventListener("webglcontextlost", onLost);
        onLiveChange(true);
      })
      .catch(() => onLiveChange(false));

    return () => {
      cancelled = true;
      sizes?.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      sceneRef.current = null;
      if (!scene) return;
      scene.dispose();
      // A remounted table (another match) would otherwise pile up contexts and evict the page's own scene.
      canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [near, onLiveChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) sceneRef.current?.update(toScene(canvas, balls), false);
  }, [balls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (strike === struck.current) return;
    struck.current = strike;
    if (canvas) sceneRef.current?.update(toScene(canvas, latest.current), true);
  }, [strike]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute -top-3.5 -left-3.5 h-[calc(100%+1.75rem)] w-[calc(100%+1.75rem)] opacity-0 transition-opacity duration-500",
        live && "opacity-100",
      )}
    />
  );
}
