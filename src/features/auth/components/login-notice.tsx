"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

import { usePathname, useRouter } from "@/i18n/navigation";

/** Says once why a Google sign-in did not go through (`?login=denied|failed`), then takes the param off the URL. */
export function LoginNotice() {
  const t = useTranslations("auth.notice");
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const outcome = search.get("login");

  useEffect(() => {
    if (outcome !== "denied" && outcome !== "failed") return;
    // The id keeps a strict-mode double run from stacking two toasts.
    toast.error(t(outcome), { id: "login-notice" });
    const rest = new URLSearchParams(search);
    rest.delete("login");
    const query = rest.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [outcome, pathname, router, search, t]);

  return null;
}
