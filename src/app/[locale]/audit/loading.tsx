import { Skeleton } from "@/components/ui/misc";

export default function AuditLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6" aria-busy="true">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-5 w-full max-w-md" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      {[0, 1, 2, 3].map((row) => (
        <Skeleton key={row} className="h-24 w-full" />
      ))}
    </div>
  );
}
