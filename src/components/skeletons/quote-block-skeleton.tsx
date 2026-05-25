import { Skeleton } from "@/components/ui/skeleton";

export function QuoteBlockSkeleton() {
  return (
    <div className="relative space-y-2 pl-6">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}
