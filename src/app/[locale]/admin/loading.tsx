import { Skeleton } from "@/components/ui/misc";

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6" aria-busy>
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-lg lg:col-span-2" />
        <div className="space-y-6">
          <Skeleton className="h-60 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
