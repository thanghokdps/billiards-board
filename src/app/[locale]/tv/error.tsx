"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function TvError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("common");
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <EmptyState title={t("error")} action={<Button onClick={reset}>{t("retry")}</Button>} />
    </div>
  );
}
