"use client";

import { motion } from "motion/react";
import { useEffect } from "react";

import { cn } from "@/lib/cn";
import { clack, haptic } from "@/lib/feedback";

import { CUE_PATH } from "../lib/table-balls";

const { start, rest } = CUE_PATH;
/** The tip meets the ball about here in the stroke. */
const CONTACT_MS = 380;

/** A cue pulls back and strikes the ball at the head of the felt. The flat table also rolls its own cue ball. */
export function CueStrike({ strike, live }: { strike: number; live: boolean }) {
  useEffect(() => {
    const id = setTimeout(() => {
      clack(0.7);
      haptic([30, 40, 30]);
    }, CONTACT_MS);
    return () => clearTimeout(id);
  }, [strike]);

  return (
    <>
      <div
        aria-hidden
        data-pocket
        data-tall={`${start.x},${start.y}`}
        className={cn(
          "pointer-events-none absolute z-10 size-0",
          live ? "top-0 left-0 translate-x-(--scene-x) translate-y-(--scene-y)" : "top-(--y) left-(--x)",
        )}
        style={{ ["--x" as string]: `${start.x}%`, ["--y" as string]: `${start.y}%` }}
      >
        <div className="-rotate-32">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: [-30, -78, -10], opacity: [0, 1, 1] }}
            transition={{ duration: 0.6, times: [0, 0.5, 1], ease: ["easeOut", "easeIn"] }}
            className="absolute -top-0.75 right-3 h-1.5 w-56 rounded-full bg-linear-to-r from-wood-dark via-wood to-lamp-soft shadow-card"
          />
        </div>
      </div>
      {!live && (
        <motion.span
          aria-hidden
          initial={{ left: `${start.x}%`, top: `${start.y}%` }}
          animate={{ left: `${rest.x}%`, top: `${rest.y}%` }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="pointer-events-none absolute -mt-4 -ml-4 size-8 rounded-full bg-ivory shadow-card"
        />
      )}
    </>
  );
}
