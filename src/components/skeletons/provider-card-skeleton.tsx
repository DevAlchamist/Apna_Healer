import { Skeleton } from "@/components/ui/skeleton";

type ProviderCardSkeletonProps = {
  className?: string;
};

export function ProviderCardSkeleton({ className = "" }: ProviderCardSkeletonProps) {
  return (
    <div
      className={`rounded-calm border border-accent/70 bg-white p-5 shadow-soft ${className}`.trim()}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-24" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>
      <Skeleton className="mt-4 h-9 w-full rounded-full" />
    </div>
  );
}
