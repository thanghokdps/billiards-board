"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/cn";

interface PosterImageProps {
  src: string;
  alt: string;
  /** Shown instead of the image when the poster route fails. */
  errorLabel: string;
  sizes: string;
  /** Above the fold: load at once instead of lazily (it is the page's LCP). */
  eager?: boolean;
  className?: string;
}

/** Posters are 1080x1350 (4:5); the Skeleton holds the space while the lazy image loads. */
export function PosterImage({ src, alt, errorLabel, sizes, eager, className }: PosterImageProps) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  return (
    <span className={cn("relative block aspect-4/5 w-full overflow-hidden rounded-md bg-surface-2", className)}>
      {state === "loading" && <Skeleton className="absolute inset-0 rounded-none" />}
      {state === "error" ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-xs text-ivory-muted">
          <ImageOff className="size-6" aria-hidden />
          {errorLabel}
        </span>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          unoptimized
          className="object-cover"
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
        />
      )}
    </span>
  );
}
