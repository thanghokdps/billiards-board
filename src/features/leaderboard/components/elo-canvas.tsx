"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";

import type { EloScene, EloSeries } from "../lib/elo-scene";

interface EloCanvasProps {
  series: EloSeries[];
  live: boolean;
  onLiveChange: (live: boolean) => void;
  /** The day under the pointer, or null when it leaves. */
  onDayChange: (day: number | null) => void;
}

const LOAD_AHEAD = "600px";

/** The Elo stage in WebGL. The line chart stays underneath for reduced motion and any WebGL failure. */
export function EloCanvas({ series, live, onLiveChange, onDayChange }: EloCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<EloScene | null>(null);
  const days = series[0]?.ratings.length ?? 0;
  const [near, setNear] = useState(false);

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
    if (!canvas || !near) return;
    let cancelled = false;
    let scene: EloScene | null = null;
    let sizes: ResizeObserver | null = null;
    let seen: IntersectionObserver | null = null;
    const onLost = () => onLiveChange(false);

    import("../lib/elo-scene")
      .then(({ EloScene: Scene }) => {
        if (cancelled) return;
        const created = new Scene(canvas, series);
        scene = created;
        sceneRef.current = created;
        sizes = new ResizeObserver(() => created.resize(canvas.clientWidth, canvas.clientHeight));
        sizes.observe(canvas);
        // The curtains draw in when they can be seen, not while the chunk happens to arrive off-screen.
        seen = new IntersectionObserver(
          ([entry]) => {
            if (!entry?.isIntersecting) return;
            created.start();
            seen?.disconnect();
          },
          { threshold: 0.3 },
        );
        seen.observe(canvas);
        canvas.addEventListener("webglcontextlost", onLost);
        onLiveChange(true);
      })
      .catch(() => onLiveChange(false));

    return () => {
      cancelled = true;
      sizes?.disconnect();
      seen?.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [near, series, onLiveChange]);

  const scrub = (event: PointerEvent<HTMLCanvasElement>) => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - left) / width));
    const day = Math.round(ratio * (days - 1));
    sceneRef.current?.show(day, ratio * 2 - 1);
    onDayChange(day);
  };

  const release = () => {
    sceneRef.current?.show(null, 0);
    onDayChange(null);
  };

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      onPointerMove={scrub}
      onPointerLeave={release}
      onPointerCancel={release}
      className={cn(
        "absolute inset-0 size-full touch-pan-y opacity-0 transition-opacity duration-500",
        live ? "opacity-100" : "pointer-events-none",
      )}
    />
  );
}
