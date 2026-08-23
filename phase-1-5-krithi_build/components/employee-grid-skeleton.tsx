import { Skeleton } from "@/components/ui/skeleton";

/** Matches the real toolbar + grid geometry so the layout does not jump. */
export function EmployeeGridSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-full sm:max-w-sm" />
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <li key={i} className="flex flex-col items-center rounded-lg border border-border bg-card p-5">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="mt-3 h-4 w-28" />
            <Skeleton className="mt-2 h-3 w-36" />
            <Skeleton className="mt-1.5 h-3 w-20" />
          </li>
        ))}
      </ul>
    </div>
  );
}
