import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/misc";

export default function HomeLoading() {
  const t = useTranslations("common");
  return (
    <div role="status" aria-busy className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <span className="sr-only">{t("loading")}</span>
      <Skeleton className="h-72 rounded-xl" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-52" />
        </div>
      </div>
    </div>
  );
}
