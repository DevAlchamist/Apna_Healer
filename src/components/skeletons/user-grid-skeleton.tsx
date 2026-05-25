import { Skeleton } from "@/components/ui/skeleton";

type UserGridSkeletonProps = { count?: number };

export function UserGridSkeleton({ count = 6 }: UserGridSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[26px] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-40" />
            </div>
          </div>
          <Skeleton className="mt-4 h-8 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
