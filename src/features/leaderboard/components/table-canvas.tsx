"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";
import type { SceneLayout } from "@/lib/table-3d/table-mesh";
import type { SceneBall, TableScene } from "@/lib/table-3d/table-scene";

import type { Point } from "../lib/pocket-layout";

export interface CanvasBall extends Omit<SceneBall, "point"> {
  tall: Point;
  wide: Point;
}

interface TableCanvasProps {
  balls: CanvasBall[];
  broken: boolean;
  live: boolean;
  onLiveChange: (live: boolean) => void;
}

const LOAD_AHEAD = "600px";

const atLayout = (balls: CanvasBall[], layout: SceneLayout): SceneBall[] =>
  balls.map(({ tall, wide, ...ball }) => ({ ...ball, point: layout === "tall" ? tall : wide }));

/**
 * The table in WebGL over the flat one. three.js is imported only as the table nears the screen, and any failure
 * (no WebGL, chunk blocked, context lost) or reduced motion leaves the flat table, which works on its own.
 */
export function TableCanvas({ balls, broken, live, onLiveChange }: TableCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<TableScene | null>(null);
  const latest = useRef({ balls, broken });
  const wasBroken = useRef(false);
  const [layout, setLayout] = useState<SceneLayout | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    latest.current = { balls, broken };
  }, [balls, broken]);

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
    const measure = () => {
      setLayout(canvas.clientWidth > canvas.clientHeight ? "wide" : "tall");

      sceneRef.current?.resize(canvas.clientWidth, canvas.clientHeight);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [near]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.parentElement;
    if (!canvas || !root || !layout) return;
    let cancelled = false;
    let scene: TableScene | null = null;
    const onLost = () => onLiveChange(false);

    import("@/lib/table-3d/table-scene")
      .then(({ TableScene: Scene }) => {
        if (cancelled) return;
        scene = new Scene(canvas, root, layout);
        sceneRef.current = scene;
        scene.resize(canvas.clientWidth, canvas.clientHeight);
        scene.update(atLayout(latest.current.balls, layout), false);
        wasBroken.current = latest.current.broken;
        canvas.addEventListener("webglcontextlost", onLost);
        onLiveChange(true);
      })
      .catch(() => onLiveChange(false));

    return () => {
      cancelled = true;
      canvas.removeEventListener("webglcontextlost", onLost);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [layout, onLiveChange]);

  useEffect(() => {
    if (!layout || !sceneRef.current) return;
    sceneRef.current.update(atLayout(balls, layout), broken && !wasBroken.current);
    wasBroken.current = broken;
  }, [balls, broken, layout]);

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
