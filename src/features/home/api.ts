import { adminCall } from "@/features/matches";

export const homeApi = {
  recap: (date: string, locale: string) =>
    adminCall<{ text: string }>("/api/admin/recap", { method: "POST", body: JSON.stringify({ date, locale }) }),
};
