import { useTranslations } from "next-intl";

import { memberErrorKey } from "@/features/submissions";
import { Link } from "@/i18n/navigation";

import type { Failure } from "../hooks/use-submit";

/** Why a send or a schedule failed, in words; `busy` also points home, where the open match waits. */
export function FailureAlert({ failure }: { failure: Failure }) {
  const t = useTranslations("submit.errors");
  const key = memberErrorKey(failure.code);
  return (
    <div role="alert" className="space-y-1 rounded-md border border-loss/50 bg-loss/10 px-3 py-2 text-sm text-loss">
      <p>{t(key)}</p>
      {key === "busy" && (
        <Link
          href={{ pathname: "/", hash: "temp" }}
          className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2"
        >
          {t("busyLink")}
        </Link>
      )}
    </div>
  );
}
