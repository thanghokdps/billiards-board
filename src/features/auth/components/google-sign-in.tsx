"use client";

import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { useReturnTo } from "../hooks/use-return-to";

interface GoogleSignInProps {
  variant?: "primary" | "outline" | "subtle";
  size?: "md" | "lg";
  /** Header use: below the `sm` breakpoint only the mark shows, so the bar keeps its room on a phone. */
  compact?: boolean;
  className?: string;
}

/** Full navigation, not a client route: the server answers with a redirect to Google and back. */
export function GoogleSignIn({ variant = "primary", size = "lg", compact, className }: GoogleSignInProps) {
  const t = useTranslations("auth");
  const returnTo = useReturnTo();
  return (
    <a
      href={`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`}
      aria-label={t("signInGoogle")}
      className={cn(buttonVariants({ variant, size }), compact && "max-sm:size-11 max-sm:px-0", className)}
    >
      <span
        aria-hidden
        className="flex size-6 items-center justify-center rounded-full bg-ivory font-display text-sm font-extrabold text-night"
      >
        G
      </span>
      <span className={cn(compact && "max-sm:sr-only")}>{t(compact ? "signIn" : "signInGoogle")}</span>
    </a>
  );
}
