import "server-only";

import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";
import type { ReactElement } from "react";

import { routing, type Locale } from "@/i18n/routing";
import { formatVnd } from "@/lib/domain";

import { posterFonts } from "./assets";
import { POSTER_SIZE } from "./templates";

/** `?locale=vi|en`, defaulting to the app default; route handlers have no locale segment. */
export function posterLocale(request: Request): Locale {
  const value = new URL(request.url).searchParams.get("locale");
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

/** Barlow has no ₫ glyph; "đ" is the everyday Vietnamese spelling of the same unit. */
export function posterVnd(amount: number, locale: Locale): string {
  return formatVnd(amount, locale).replace("₫", "đ");
}

// Matches can be edited or undone, so CDN copies stay short-lived.
const CACHE = "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

export async function renderPoster(element: ReactElement): Promise<Response> {
  return new ImageResponse(element, {
    ...POSTER_SIZE,
    fonts: await posterFonts(),
    headers: { "cache-control": CACHE },
  });
}
