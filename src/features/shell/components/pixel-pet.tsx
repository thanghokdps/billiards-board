"use client";

import { useEffect, useRef } from "react";

import { usePathname } from "@/i18n/navigation";
import { prefersReducedMotion } from "@/lib/motion";

import { PetBrain, type PetPose, type PetTrack } from "../lib/pet-brain";
import { drawSprite, readPixelColors, SPRITE_HEIGHT, SPRITE_WIDTH } from "../lib/pet-sprites";

const MAX_FRAME_MS = 50;
const SLEEP_FRAME_MS = 500;
const SHADOW_FADE_PX = 120;
const EDGE_GAP_PX = 2;
const FLOOR_GAP_PX = 6;
// A phone's dock spans the screen, leaving no floor to walk on.
const WIDE_SCREEN = "(min-width: 40rem)";

function readTrack(sprite: HTMLCanvasElement, dock: Element): PetTrack {
  const { left, right, top } = dock.getBoundingClientRect();
  const half = sprite.offsetWidth / 2;
  return {
    left: half + EDGE_GAP_PX,
    right: window.innerWidth - half - EDGE_GAP_PX,
    floor: window.innerHeight - FLOOR_GAP_PX,
    dockLeft: left - half,
    dockRight: right + half,
    dockTop: top,
  };
}

function puffDust(x: number, y: number) {
  const dust = document.createElement("span");
  dust.className = "pet-dust";
  dust.style.left = `${x}px`;
  dust.style.top = `${y}px`;
  dust.addEventListener("animationend", () => dust.remove());
  document.body.append(dust);
}

/** A pixel 8-ball that walks along the screen's foot and over the dock, and hops onto the key you press. Decoration: hidden from readers, never clickable. */
export function PixelPet() {
  const rootRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLCanvasElement>(null);
  const shadowRef = useRef<HTMLSpanElement>(null);
  const brainRef = useRef<PetBrain | null>(null);
  const pathname = usePathname();
  const seenPath = useRef(pathname);

  useEffect(() => {
    const [root, sprite, shadow] = [rootRef.current, spriteRef.current, shadowRef.current];
    const ctx = sprite?.getContext("2d");
    const dock = document.querySelector(".dock");
    if (!root || !sprite || !shadow || !ctx || !dock) return;
    if (prefersReducedMotion() || !window.matchMedia(WIDE_SCREEN).matches) return;

    root.hidden = false;
    const colors = readPixelColors(root);
    const brain = new PetBrain(readTrack(sprite, dock), puffDust, performance.now());
    brainRef.current = brain;

    let drawn = "";
    const paint = (pose: PetPose) => {
      const key = `${pose.face}|${pose.feet}|${pose.bubble}|${pose.bob}`;
      if (key !== drawn) drawSprite(ctx, colors, pose);
      drawn = key;
      root.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0)`;
      const stretch = pose.lift > 0 ? 1.08 : 1 / pose.squash;
      sprite.style.transform = `translateY(${-pose.lift}px) scale(${pose.flip ? -stretch : stretch}, ${pose.squash}) rotate(${pose.rotate}deg)`;
      shadow.style.opacity = String(Math.max(1 - pose.lift / SHADOW_FADE_PX, 0.25));
    };

    let frame = 0;
    let timer = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const pose = brain.update(now, Math.min(now - last, MAX_FRAME_MS));
      last = now;
      paint(pose);
      if (pose.asleep) timer = window.setTimeout(() => (frame = requestAnimationFrame(tick)), SLEEP_FRAME_MS);
      else frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!timer) return;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      timer = 0;
      frame = requestAnimationFrame(tick);
    };

    const onClick = (e: MouseEvent) => {
      // A keyboard "click" has no position, so there is nowhere to jump to.
      if (e.detail === 0 || !(e.target instanceof Element)) return;
      const key = e.target.closest(".dock a, .dock button");
      const dock = key?.closest(".dock");
      if (!key || !dock) return;
      const spot = key.getBoundingClientRect();
      // The dock stacks above the pet, so it stands on the rail, or on the 8-ball that rises past it.
      const top = Math.min(spot.top, dock.getBoundingClientRect().top);
      brain.click(spot.left + spot.width / 2, top, performance.now());
      wake();
    };
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      brain.scroll(window.scrollY - lastScrollY, performance.now());
      lastScrollY = window.scrollY;
      wake();
    };
    const onPointerMove = (e: PointerEvent) => brain.lookAt(e.clientX);
    const onResize = () => brain.resize(readTrack(sprite, dock));

    window.addEventListener("click", onClick, { capture: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", onResize);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      brainRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (seenPath.current === pathname) return;
    seenPath.current = pathname;
    brainRef.current?.routeChanged(performance.now());
  }, [pathname]);

  return (
    <div ref={rootRef} aria-hidden hidden className="pet">
      <span ref={shadowRef} className="pet-shadow" />
      <canvas ref={spriteRef} width={SPRITE_WIDTH} height={SPRITE_HEIGHT} className="pet-sprite" />
    </div>
  );
}
