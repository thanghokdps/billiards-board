"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function PlayerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <EmptyState title={t("error")} action={<Button onClick={reset}>{t("retry")}</Button>} />
    </div>
  );
}
