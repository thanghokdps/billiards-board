"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";

import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";
import type { CuePath, Point, SceneBall, TableScene } from "@/lib/table-3d/table-scene";

/** Same breakpoint as `.rack-menu` in scenes.css, where the table lies flat. */
const WIDE_QUERY = "(width >= 40rem)";
const TIGHT = 0.42;
const ROW_DELAY_MS = 30;
const LAST_ROW = 4;

const BREAK: Record<"rack-tall" | "rack-wide", { centre: Point; cue: CuePath }> = {
  "rack-tall": {
    centre: { x: 50, y: 42 },
    cue: { start: { x: 50, y: 97 }, hit: { x: 50, y: 62 }, rest: { x: 80, y: 84 } },
  },
  "rack-wide": {
    centre: { x: 62, y: 50 },
    cue: { start: { x: 4, y: 50 }, hit: { x: 42, y: 50 }, rest: { x: 22, y: 20 } },
  },
};

/** Where a rack seat sits on the felt, in %, matching the flat diamond in scenes.css. */
function seatPoint(row: number, lane: number, layout: keyof typeof BREAK): Point {
  const { centre } = BREAK[layout];
  return layout === "rack-tall"
    ? { x: centre.x + lane * 16, y: centre.y + (row - 2) * 15.5 }
    : { x: centre.x - (row - 2) * 14, y: centre.y + lane * 15 };
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(WIDE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export interface RackCanvasBall {
  /** A CSS colour token such as `var(--color-pool-red)`; three needs it resolved. */
  color: string;
  row: number;
  lane: number;
}

interface RackCanvasProps {
  balls: RackCanvasBall[];
  live: boolean;
  onLiveChange: (live: boolean) => void;
  sceneRef: RefObject<TableScene | null>;
}

/** The racked table in WebGL over the flat one, which stays for reduced motion and any WebGL failure. */
export function RackCanvas({ balls, live, onLiveChange, sceneRef }: RackCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layout = useSyncExternalStore<keyof typeof BREAK>(
    subscribe,
    () => (window.matchMedia(WIDE_QUERY).matches ? "rack-wide" : "rack-tall"),
    () => "rack-tall",
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.parentElement;
    if (!canvas || !root || prefersReducedMotion()) return;
    let cancelled = false;
    let scene: TableScene | null = null;
    let sizes: ResizeObserver | null = null;
    const onLost = () => onLiveChange(false);
    const css = getComputedStyle(canvas);
    const seated: SceneBall[] = balls.map(({ color, row, lane }, id) => ({
      id,
      color: css.getPropertyValue(color.slice(4, -1)).trim(),
      number: "",
      point: seatPoint(row, lane, layout),
      delayMs: (LAST_ROW - row) * ROW_DELAY_MS,
    }));
    const { centre, cue } = BREAK[layout];

    import("@/lib/table-3d/table-scene")
      .then(({ TableScene: Scene }) => {
        if (cancelled) return;
        const created = new Scene(canvas, root, layout, cue);
        scene = created;
        sceneRef.current = created;
        created.resize(canvas.clientWidth, canvas.clientHeight);
        sizes = new ResizeObserver(() => created.resize(canvas.clientWidth, canvas.clientHeight));
        sizes.observe(canvas);
        const racked = seated.map(({ point, ...ball }) => ({
          ...ball,
          point: {
            x: centre.x + (point.x - centre.x) * TIGHT,
            y: centre.y + (point.y - centre.y) * TIGHT,
          },
        }));
        created.update(racked, false);
        created.update(seated, true);
        canvas.addEventListener("webglcontextlost", onLost);
        onLiveChange(true);
      })
      .catch(() => onLiveChange(false));

    return () => {
      cancelled = true;
      sizes?.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      sceneRef.current = null;
      onLiveChange(false);
      if (!scene) return;
      scene.dispose();
      // A menu opened all day would otherwise pile up contexts and evict the page's own scene.
      canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [balls, layout, onLiveChange, sceneRef]);

  return (
    // The key gives a turned phone a fresh canvas: the old one's context was released above.
    <canvas
      key={layout}
      ref={canvasRef}
      aria-hidden
      className={cn("rack-canvas pointer-events-none opacity-0 transition-opacity duration-200", live && "opacity-100")}
    />
  );
}
