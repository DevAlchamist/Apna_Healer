import { Skeleton } from "@/components/ui/skeleton";

export function ActivityFeedSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="relative pl-5">
          <Skeleton className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full" />
          <Skeleton className="h-2 w-16" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-1 h-2 w-4/5" />
        </div>
      ))}
    </div>
  );
}
