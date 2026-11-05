import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

import { useReducedMotion } from "../hooks/use-reduced-motion";

interface SlideFrameProps {
  kicker: string;
  className?: string;
  children: ReactNode;
}

/** Shared layout of a story slide: the kicker as its heading, content centred, turning in from the right on mount. */
export function SlideFrame({ kicker, className, children }: SlideFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const rise = ref.current?.animate(
      [
        { opacity: 0, transform: "perspective(60rem) translateX(48px) rotateY(-32deg)" },
        { opacity: 1, transform: "perspective(60rem) translateX(0) rotateY(0)" },
      ],
      { duration: 520, easing: "cubic-bezier(0.2, 0.9, 0.25, 1)", fill: "backwards" },
    );
    return () => rise?.cancel();
  }, [reduced]);

  return (
    <div ref={ref} className={cn("flex flex-1 flex-col justify-center gap-5 px-6 pb-16 pt-4", className)}>
      <h2 className="font-display text-xl font-bold text-lamp">{kicker}</h2>
      {children}
    </div>
  );
}

/** The big scoreboard number of a slide. */
export function HeroNumber({
  children,
  className,
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <p className={cn("digits text-9xl font-bold leading-none text-lamp", glow && "digits-glow", className)}>
      {children}
    </p>
  );
}
