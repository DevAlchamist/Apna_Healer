import { Skeleton } from "@/components/ui/skeleton";

export function AdminOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-2/3 max-w-md rounded-2xl" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[200px] rounded-[28px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[320px] rounded-[28px]" />
        <Skeleton className="h-[320px] rounded-[28px]" />
      </div>
    </div>
  );
}
