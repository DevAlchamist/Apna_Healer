import { Skeleton } from "@/components/ui/skeleton";

type StatCardsSkeletonProps = {
  count?: number;
  className?: string;
};

export function StatCardsSkeleton({ count = 4, className = "" }: StatCardsSkeletonProps) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`.trim()}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[1.25rem] border border-[#ebe6de]/80 bg-white p-5 shadow-sm"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
