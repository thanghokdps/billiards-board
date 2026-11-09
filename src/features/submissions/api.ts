import { adminCall } from "@/features/matches";
import type { SubmissionInput, SubmissionView } from "@/server/submissions/schema";

type Via = "chat" | "ui";

/** Admin decisions on viewer-submitted matches; shared by the Admin pending stack and the chat confirm card. */
export const submissionsApi = {
  list: () => adminCall<{ submissions: SubmissionView[] }>("/api/admin/submissions", { method: "GET" }),
  approve: (id: string, options: { edited?: SubmissionInput; via?: Via } = {}) =>
    adminCall<{ matchId: string; submission: SubmissionView }>(`/api/admin/submissions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(options),
    }),
  reject: (id: string, options: { via?: Via } = {}) =>
    adminCall<{ submission: SubmissionView }>(`/api/admin/submissions/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(options),
    }),
};
