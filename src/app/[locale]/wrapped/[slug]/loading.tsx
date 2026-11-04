import { Skeleton } from "@/components/ui/misc";

export default function WrappedStoryLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night" aria-busy>
      <div className="flex h-full w-full max-w-md flex-col gap-4 p-4">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-10 w-40 rounded-full" />
        <Skeleton className="flex-1 rounded-xl" />
      </div>
    </div>
  );
}
