import { Skeleton } from "@/components/ui/misc";

export default function HistoryLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6" aria-busy="true">
      <Skeleton className="h-10 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-sm rounded-full" />
        <Skeleton className="h-10 w-full max-w-xs rounded-full" />
      </div>
      {[0, 1].map((day) => (
        <div key={day} className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ))}
    </div>
  );
}
