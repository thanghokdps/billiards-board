import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6" aria-busy="true">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-52 w-full" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
