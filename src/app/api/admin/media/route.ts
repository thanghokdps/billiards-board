import { NextResponse } from "next/server";

import { HttpError, requireAdmin, route } from "@/server/http";
import { MEDIA_MAX_BYTES, MEDIA_TYPES, saveMedia } from "@/server/media/repository";

const isMediaType = (type: string): type is (typeof MEDIA_TYPES)[number] =>
  (MEDIA_TYPES as readonly string[]).includes(type);

/** Image magic bytes, so a renamed file is refused whatever its declared type. */
function sniff(buffer: Buffer): string | null {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer.subarray(0, 4).toString("hex") === "89504e47") return "image/png";
  if (buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

export const POST = route(async (request) => {
  await requireAdmin(request);
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MEDIA_MAX_BYTES + 10_000) throw new HttpError("invalid_body", "file too large");
  const form = await request.formData().catch(() => {
    throw new HttpError("invalid_body");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError("invalid_body", "file missing");
  if (file.size > MEDIA_MAX_BYTES) throw new HttpError("invalid_body", "file too large");
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = sniff(buffer);
  if (!type || !isMediaType(type)) throw new HttpError("invalid_body", "jpeg, png or webp only");
  const id = await saveMedia(type, buffer);
  return NextResponse.json({ id, url: `/api/media/${id}` }, { status: 201 });
});
