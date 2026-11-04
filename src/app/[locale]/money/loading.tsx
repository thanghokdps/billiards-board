import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6" aria-busy="true">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-72 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
