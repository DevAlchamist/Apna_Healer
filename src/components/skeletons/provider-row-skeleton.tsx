import { Skeleton } from "@/components/ui/skeleton";

type ProviderRowSkeletonProps = {
  className?: string;
};

export function ProviderRowSkeleton({ className = "" }: ProviderRowSkeletonProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <Skeleton className="h-12 w-12 shrink-0 rounded-full bg-accent/60" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-24 rounded bg-accent/60" />
        <Skeleton className="h-2 w-16 rounded bg-accent/40" />
      </div>
    </div>
  );
}
