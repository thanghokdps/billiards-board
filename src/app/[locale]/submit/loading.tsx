import { Skeleton } from "@/components/ui/misc";

export default function SubmitLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6" aria-busy>
      <Skeleton className="h-10 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-12 w-3/4 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
    </div>
  );
}
