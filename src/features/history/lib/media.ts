/** Mirrors `MEDIA_MAX_BYTES` / `MEDIA_TYPES` in `server/media/repository.ts` (server-only, so not importable here). */
export const MEDIA_MAX_BYTES = 1_500_000;
export const MEDIA_ACCEPT = "image/jpeg,image/png,image/webp";

export type UploadProblem = "type" | "size";

/** Checks a picked file before any request, so the admin sees a clear reason instead of a 400. */
export function checkImage(file: File): UploadProblem | null {
  if (!MEDIA_ACCEPT.split(",").includes(file.type)) return "type";
  if (file.size > MEDIA_MAX_BYTES) return "size";
  return null;
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:" && value.length <= 500;
  } catch {
    return false;
  }
}
