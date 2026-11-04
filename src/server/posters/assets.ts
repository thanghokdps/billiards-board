import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getMedia } from "@/server/media/repository";

const FONT_DIR = join(process.cwd(), "src/server/posters/fonts");

type PosterFont = { name: string; data: Buffer; weight: 600 | 700 | 800; style: "normal" };

let fonts: Promise<PosterFont[]> | null = null;

/** Barlow (OFL) covers Vietnamese diacritics; next/og's bundled font does not. Loaded once per process. */
export function posterFonts(): Promise<PosterFont[]> {
  fonts ??= Promise.all([
    load("Display", "BarlowCondensed-Bold.ttf", 700),
    load("Display", "BarlowCondensed-ExtraBold.ttf", 800),
    load("Body", "Barlow-SemiBold.ttf", 600),
    load("Body", "Barlow-Bold.ttf", 700),
  ]);
  return fonts;
}

async function load(name: string, file: string, weight: PosterFont["weight"]): Promise<PosterFont> {
  return { name, data: await readFile(join(FONT_DIR, file)), weight, style: "normal" };
}

/** Satori cannot fetch our relative /api/media URLs, so uploaded avatars are inlined as data URIs. */
export async function avatarSrc(avatarUrl: string | null): Promise<string | null> {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("https://")) return avatarUrl;
  const id = avatarUrl.match(/^\/api\/media\/([0-9a-f-]{36})$/i)?.[1];
  if (!id) return null;
  const row = await getMedia(id);
  return row ? `data:${row.mime};base64,${Buffer.from(row.data).toString("base64")}` : null;
}
