"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";

import type { ChipScene } from "../lib/chip-scene";

interface ChipCanvasProps {
  totals: number[];
  live: boolean;
  onLiveChange: (live: boolean) => void;
  /** The bucket under the pointer, or null when it leaves. */
  onActiveChange: (index: number | null) => void;
}

const LOAD_AHEAD = "600px";

/** Bill totals as chip stacks in WebGL. The bar chart stays underneath for reduced motion and any WebGL failure. */
export function ChipCanvas({ totals, live, onLiveChange, onActiveChange }: ChipCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ChipScene | null>(null);
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
    const root = canvas?.parentElement;
    if (!canvas || !root || !near) return;
    let cancelled = false;
    let scene: ChipScene | null = null;
    let sizes: ResizeObserver | null = null;
    let seen: IntersectionObserver | null = null;
    const onLost = () => onLiveChange(false);

    import("../lib/chip-scene")
      .then(({ ChipScene: Scene }) => {
        if (cancelled) return;
        const created = new Scene(canvas, root, totals);
        scene = created;
        sceneRef.current = created;
        sizes = new ResizeObserver(() => created.resize(canvas.clientWidth, canvas.clientHeight));
        sizes.observe(canvas);
        // The chips fall when they can be seen, not while the chunk happens to arrive off-screen.
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
  }, [near, totals, onLiveChange]);

  const scrub = (event: PointerEvent<HTMLCanvasElement>) => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(0.999, Math.max(0, (event.clientX - left) / width));
    const index = Math.floor(ratio * totals.length);
    sceneRef.current?.show(index, ratio * 2 - 1);
    onActiveChange(index);
  };

  const release = () => {
    sceneRef.current?.show(null, 0);
    onActiveChange(null);
  };

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      onPointerDown={scrub}
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
