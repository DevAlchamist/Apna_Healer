import { Skeleton } from "@/components/ui/skeleton";

type ContentGridSkeletonProps = { count?: number; columns?: 2 | 3 | 4 };

export function ContentGridSkeleton({ count = 6, columns = 3 }: ContentGridSkeletonProps) {
  const colClass =
    columns === 4
      ? "sm:grid-cols-2 xl:grid-cols-4"
      : columns === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid gap-4 ${colClass}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-calm bg-white p-5 shadow-soft">
          <Skeleton className="h-32 w-full rounded-gentle" />
          <Skeleton className="mt-4 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-full" />
        </div>
      ))}
    </div>
  );
}
