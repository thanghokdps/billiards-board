"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function WheelError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("common");
  return <EmptyState title={t("error")} action={<Button onClick={reset}>{t("retry")}</Button>} />;
}
