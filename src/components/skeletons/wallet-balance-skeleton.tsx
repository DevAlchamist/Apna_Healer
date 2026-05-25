import { Skeleton } from "@/components/ui/skeleton";

export function WalletBalanceSkeleton() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Skeleton className="mx-auto h-3 w-40" />
      <Skeleton className="mx-auto mt-3 h-16 w-48 md:h-20" />
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-gentle" />
        ))}
      </div>
    </div>
  );
}
