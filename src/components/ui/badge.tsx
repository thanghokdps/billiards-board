import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full font-semibold leading-none", {
  variants: {
    tone: {
      neutral: "bg-surface-3 text-ivory-muted",
      lamp: "bg-lamp/15 text-lamp",
      felt: "bg-felt/30 text-win",
      win: "bg-win/15 text-win",
      loss: "bg-loss/15 text-loss",
      cold: "bg-cold/15 text-cold",
      ball: "bg-ball text-ivory",
    },
    size: { sm: "px-2 py-1 text-2xs", md: "px-2.5 py-1.5 text-xs" },
  },
  defaultVariants: { tone: "neutral", size: "sm" },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}
