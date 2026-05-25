import { Skeleton } from "@/components/ui/skeleton";

type SessionRowSkeletonProps = {
  className?: string;
};

export function SessionRowSkeleton({ className = "" }: SessionRowSkeletonProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-[20px] bg-white/60 px-4 py-3 ${className}`.trim()}
    >
      <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-2 w-24" />
      </div>
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  );
}
