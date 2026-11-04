import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";

import { adminErrorKey } from "../api";

/**
 * One admin write: runs `action` (which returns the success toast text), then refreshes the server data.
 * A failure shows the mapped error toast; an expired session also refreshes so the login card comes back.
 */
export function useAdminAction() {
  const t = useTranslations("admin.errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run(action: () => Promise<string>): Promise<boolean> {
    setPending(true);
    try {
      const message = await action();
      router.refresh();
      toast.success(message);
      return true;
    } catch (error) {
      const key = adminErrorKey(error);
      toast.error(t(key));
      if (key === "unauthenticated") router.refresh();
      return false;
    } finally {
      setPending(false);
    }
  }

  return { pending, run };
}
