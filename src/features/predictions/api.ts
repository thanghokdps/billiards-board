import { adminCall } from "@/features/matches";
import type { GameType, Side } from "@/lib/domain";

export const predictionsApi = {
  create: (body: { date: string; gameType: GameType | null; sideA: number[]; sideB: number[] }) =>
    adminCall<{ prediction: { id: number } }>("/api/admin/predictions", { method: "POST", body: JSON.stringify(body) }),
  vote: (id: number, voterId: number, pick: Side) =>
    adminCall<{ ok: true }>(`/api/admin/predictions/${id}/votes`, {
      method: "PUT",
      body: JSON.stringify({ voterId, pick }),
    }),
  cancel: (id: number) => adminCall<{ ok: true }>(`/api/admin/predictions/${id}`, { method: "DELETE" }),
};
