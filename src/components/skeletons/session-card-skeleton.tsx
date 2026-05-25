import { Skeleton } from "@/components/ui/skeleton";

type SessionCardSkeletonProps = {
  className?: string;
};

export function SessionCardSkeleton({ className = "" }: SessionCardSkeletonProps) {
  return (
    <div
      className={`rounded-[22px] border border-white/60 bg-white/70 p-5 shadow-[0_8px_30px_-12px_rgba(45,90,76,0.12)] ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-2 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-16 rounded-xl" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
}
