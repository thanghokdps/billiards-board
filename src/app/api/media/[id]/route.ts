import { HttpError, route } from "@/server/http";
import { getMedia } from "@/server/media/repository";

type Context = { params: Promise<{ id: string }> };

export const GET = route(async (_request, { params }: Context) => {
  const row = await getMedia((await params).id);
  if (!row) throw new HttpError("not_found");
  return new Response(new Uint8Array(row.data), {
    headers: {
      "content-type": row.mime,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
});
