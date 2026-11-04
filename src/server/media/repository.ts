import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { media } from "@/db/schema";

export const MEDIA_MAX_BYTES = 1_500_000;
export const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export async function saveMedia(mime: (typeof MEDIA_TYPES)[number], data: Buffer): Promise<string> {
  const [row] = await db.insert(media).values({ mime, bytes: data.length, data }).returning({ id: media.id });
  if (!row) throw new Error("media insert returned no row");
  return row.id;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getMedia(id: string) {
  if (!UUID.test(id)) return undefined;
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return row;
}
