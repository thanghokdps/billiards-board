import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** The six pockets in % of the felt; the WebGL table draws its own, so these show only on the flat one. */
const POCKETS = [
  [0, 0],
  [100, 0],
  [0, 50],
  [100, 50],
  [0, 100],
  [100, 100],
] as const;

/** The flat table: wood rail, felt and pockets. It fades out once the 3D table is drawing over it. */
export function TableFelt({ live, children }: { live: boolean; children: ReactNode }) {
  return (
    <div className="relative rounded-xl p-3.5">
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-xl bg-wood shadow-card transition-opacity duration-500",
          live && "opacity-0",
        )}
      />
      <div className="relative aspect-3/4 rounded-md">
        <div
          aria-hidden
          className={cn("felt absolute inset-0 rounded-md transition-opacity duration-500", live && "opacity-0")}
        />
        {!live &&
          POCKETS.map(([x, y]) => (
            <span
              key={`${x}-${y}`}
              aria-hidden
              className="absolute -mt-4 -ml-4 size-8 rounded-full bg-night shadow-inner"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))}
        {children}
      </div>
    </div>
  );
}
