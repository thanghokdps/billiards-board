import { AdminApiError, adminCall } from "@/features/matches";
import type { PlayerRef } from "@/server/matches/schema";

export const wheelApi = {
  /** Saves a named guest. Idempotent: an existing guest of that name comes back as is; a member's name is a `conflict`. */
  addGuest: (name: string) =>
    adminCall<PlayerRef>("/api/admin/guests", { method: "POST", body: JSON.stringify({ name }) }),
};

export type GuestErrorKey = "guestConflict" | "guestInvalid" | "guestExpired" | "guestFailed";

/** The wheel message key for a failed `addGuest`. */
export function guestErrorKey(error: unknown): GuestErrorKey {
  if (!(error instanceof AdminApiError)) return "guestFailed";
  if (error.code === "conflict") return "guestConflict";
  if (error.code === "invalid_body") return "guestInvalid";
  return error.code === "unauthenticated" ? "guestExpired" : "guestFailed";
}
