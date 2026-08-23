import { Skeleton } from "@/components/ui/skeleton";

/** Matches the toolbar, tiles and table geometry so nothing jumps on load. */
export function AttendanceSkeleton() {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="size-7" />
        <Skeleton className="size-7" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-40" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card px-4 py-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-10" />
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-px rounded-lg border border-border p-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="ml-auto h-3 w-14" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}
