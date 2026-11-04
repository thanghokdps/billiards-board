import { Skeleton } from "@/components/ui/misc";

export default function PlayerLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6" aria-busy>
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-125 w-full lg:col-span-2" />
        <div className="space-y-6 lg:col-span-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
