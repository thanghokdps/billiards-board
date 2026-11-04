import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6" aria-busy="true">
      <Skeleton className="h-10 w-56" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-4/5 w-full" />
        ))}
      </div>
    </div>
  );
}
