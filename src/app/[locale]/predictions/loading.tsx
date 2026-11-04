import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/misc";

export default function PredictionsLoading() {
  const t = useTranslations("common");
  return (
    <div role="status" aria-busy className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <span className="sr-only">{t("loading")}</span>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
