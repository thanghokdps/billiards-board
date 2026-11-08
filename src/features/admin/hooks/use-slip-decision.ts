import { useReducedMotion } from "motion/react";
import { useState } from "react";

import { submissionsApi } from "@/features/submissions";
import { useRouter } from "@/i18n/navigation";

import { adminErrorKey, type AdminErrorKey } from "../api";

export type SlipPhase = "idle" | "sending" | "approved" | "rejected";

/** How long the stamp or the drop plays before the server list is re-read and the slip is gone. */
const STAMP_MS = 900;
const REDUCED_MS = 450;
const STALE_MS = 2500;

/** Approve or reject one pending submission: lock the buttons while it runs, play the finish, then refresh. */
export function useSlipDecision(id: string) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<SlipPhase>("idle");
  const [error, setError] = useState<AdminErrorKey | null>(null);

  async function decide(kind: "approved" | "rejected") {
    if (phase !== "idle") return;
    setPhase("sending");
    setError(null);
    try {
      if (kind === "approved") await submissionsApi.approve(id, { via: "ui" });
      else await submissionsApi.reject(id, { via: "ui" });
    } catch (e) {
      const key = adminErrorKey(e);
      setError(key);
      setPhase("idle");
      // An expired session needs the login card back; a slip someone else decided is stale, so it goes after the message is read.
      if (key === "unauthenticated") router.refresh();
      if (key === "conflict" || key === "not_found") setTimeout(() => router.refresh(), STALE_MS);
      return;
    }
    setPhase(kind);
    setTimeout(() => router.refresh(), reduced ? REDUCED_MS : STAMP_MS);
  }

  return {
    phase,
    error,
    approve: () => decide("approved"),
    reject: () => decide("rejected"),
  };
}
