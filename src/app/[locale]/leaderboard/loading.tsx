import { Skeleton } from "@/components/ui/misc";

export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6" aria-busy>
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-10 w-full rounded-full" />
      <div className="grid grid-cols-3 items-end gap-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-56" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
