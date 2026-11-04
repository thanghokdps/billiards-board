import { Skeleton } from "@/components/ui/misc";

export default function TvLoading() {
  return (
    <div className="flex min-h-dvh flex-col gap-6 p-4 md:p-8" aria-busy>
      <Skeleton className="h-14 w-72" />
      <div className="grid flex-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="min-h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
