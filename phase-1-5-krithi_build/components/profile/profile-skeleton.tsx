import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the profile header, info columns and tab bar so nothing shifts. */
export function ProfileSkeleton() {
  return (
    <div>
      <div className="flex flex-wrap items-start gap-5">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="mt-6 grid gap-x-10 gap-y-3 border-y border-border py-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, col) => (
          <div key={col} className="space-y-3">
            {Array.from({ length: col === 0 ? 3 : 4 }).map((_, row) => (
              <div key={row} className="grid grid-cols-[9rem_1fr] gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
