import { adminCall } from "@/features/matches";

export interface SessionPatch {
  attendees?: number[];
  venue?: string | null;
  tableLabel?: string | null;
}

export const homeApi = {
  recap: (date: string, locale: string) =>
    adminCall<{ text: string }>("/api/admin/recap", { method: "POST", body: JSON.stringify({ date, locale }) }),
  updateSession: (date: string, patch: SessionPatch) =>
    adminCall<{ session: unknown }>(`/api/admin/sessions/${date}`, { method: "PUT", body: JSON.stringify(patch) }),
};
