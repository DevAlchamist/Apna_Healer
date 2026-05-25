import { Skeleton } from "@/components/ui/skeleton";

type ApplicationListSkeletonProps = { count?: number };

export function ApplicationListSkeleton({ count = 4 }: ApplicationListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[26px] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-24" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
