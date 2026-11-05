"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";
import type { Slice } from "@/lib/wheel";

import type { WheelScene } from "../lib/wheel-scene";

interface WheelCanvasProps {
  slices: Slice[];
  rotation: number;
  sceneRef: RefObject<WheelScene | null>;
  live: boolean;
  onLiveChange: (live: boolean) => void;
}

const LOAD_AHEAD = "400px";

/**
 * The wheel in WebGL over the flat one. three.js is imported only as the wheel nears the screen, and any failure
 * (no WebGL, chunk blocked, context lost) or reduced motion leaves the flat wheel, which works on its own.
 */
export function WheelCanvas({ slices, rotation, sceneRef, live, onLiveChange }: WheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ slices, rotation });
  const [near, setNear] = useState(false);

  useEffect(() => {
    latest.current = { slices, rotation };
  }, [slices, rotation]);

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
    let scene: WheelScene | null = null;
    let resizer: ResizeObserver | null = null;
    const onLost = () => onLiveChange(false);

    async function start(target: HTMLCanvasElement) {
      const [{ WheelScene: Scene }] = await Promise.all([import("../lib/wheel-scene"), document.fonts.ready]);
      if (cancelled) return;
      scene = new Scene(target);
      sceneRef.current = scene;
      const current = scene;
      resizer = new ResizeObserver(() => current.resize(target.clientWidth, target.clientHeight));
      resizer.observe(target);
      scene.resize(target.clientWidth, target.clientHeight);
      scene.setSlices(latest.current.slices, latest.current.rotation);
      target.addEventListener("webglcontextlost", onLost);
      onLiveChange(true);
    }

    start(canvas).catch(() => onLiveChange(false));

    return () => {
      cancelled = true;
      canvas.removeEventListener("webglcontextlost", onLost);
      resizer?.disconnect();
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [near, onLiveChange, sceneRef]);

  useEffect(() => {
    sceneRef.current?.setSlices(slices, latest.current.rotation);
  }, [slices, sceneRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 size-full opacity-0 transition-opacity duration-700",
        live && "opacity-100",
      )}
    />
  );
}
