"use client";

import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion";

import { SmokeRenderer } from "../lib/smoke-shader";

// Smoke has no fine detail, so a small buffer scaled up by CSS looks the same and costs a fraction on phones.
const RENDER_SCALE = 0.4;
const FRAME_MS = 33;
const LAMP_SWAY = 0.05;
const LAMP_EASE = 0.04;
const SCROLL_DRIFT = 0.00015;

/** The room behind the page. Decoration: with no WebGL the canvas stays empty over the CSS lamp gradient. */
export function LampSmoke() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const light = getComputedStyle(canvas).getPropertyValue("--color-lamp-soft");
    const smoke = SmokeRenderer.create(canvas, light);
    if (!smoke) return;

    const reduced = prefersReducedMotion();
    let frame = 0;
    let lastDraw = 0;
    let lampX = 0;
    let targetX = 0;

    const draw = (now: number) => smoke.draw(now / 1000, lampX, -window.scrollY * SCROLL_DRIFT);
    const resize = () => {
      canvas.width = Math.ceil(window.innerWidth * RENDER_SCALE);
      canvas.height = Math.ceil(window.innerHeight * RENDER_SCALE);
      smoke.resize(canvas.width, canvas.height);
      if (reduced) draw(0);
    };
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;
      lampX += (targetX - lampX) * LAMP_EASE;
      draw(now);
    };
    const onPointerMove = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * LAMP_SWAY * 2;
    };
    const onContextLost = () => cancelAnimationFrame(frame);

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("webglcontextlost", onContextLost);
    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      frame = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("webglcontextlost", onContextLost);
    };
  }, []);

  return <canvas ref={canvasRef} className="backdrop-layer" />;
}
