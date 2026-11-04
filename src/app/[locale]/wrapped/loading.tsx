import { Skeleton } from "@/components/ui/misc";

export default function WrappedLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6" aria-busy>
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-4 w-full max-w-prose" />
      <Skeleton className="h-10 w-64 rounded-full" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
