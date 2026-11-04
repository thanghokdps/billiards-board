import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/misc";

export default function HomeLoading() {
  const t = useTranslations("common");
  return (
    <div role="status" aria-busy className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <span className="sr-only">{t("loading")}</span>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-56" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </div>
  );
}
