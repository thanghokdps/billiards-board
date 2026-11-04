"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { AdminApiError } from "@/features/matches";
import { useRouter } from "@/i18n/navigation";

const KNOWN = { unauthenticated: "unauthenticated", not_found: "notFound", invalid_body: "invalid" } as const;

/** Runs one admin write: tracks `pending`, toasts a translated error, refreshes the server data on success. */
export function useAdminRun() {
  const t = useTranslations("history.errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run(action: () => Promise<void>): Promise<boolean> {
    setPending(true);
    try {
      await action();
      router.refresh();
      return true;
    } catch (error) {
      const code = error instanceof AdminApiError ? error.code : "";
      toast.error(t(KNOWN[code as keyof typeof KNOWN] ?? "generic")); // code comes from the API's closed error set
      return false;
    } finally {
      setPending(false);
    }
  }

  return { pending, run };
}
