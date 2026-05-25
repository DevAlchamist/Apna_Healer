import { Skeleton } from "@/components/ui/skeleton";

export function ListenerRequestCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[1.25rem] border border-[#ebe6de] bg-white p-5 shadow-sm">

      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-2 w-28" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-16 rounded-xl" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}
