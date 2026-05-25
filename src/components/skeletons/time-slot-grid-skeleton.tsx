import { Skeleton } from "@/components/ui/skeleton";

type TimeSlotGridSkeletonProps = { count?: number };

export function TimeSlotGridSkeleton({ count = 6 }: TimeSlotGridSkeletonProps) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded-calm" />
      ))}
    </div>
  );
}
