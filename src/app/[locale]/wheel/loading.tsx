import { Skeleton } from "@/components/ui/misc";

export default function WheelLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6" aria-busy>
      <Skeleton className="h-10 w-56" />
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="aspect-square rounded-lg lg:col-span-3" />
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-56 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
