import { SessionRowSkeleton } from "@/components/skeletons/session-row-skeleton";

type TransactionListSkeletonProps = { count?: number };

export function TransactionListSkeleton({ count = 4 }: TransactionListSkeletonProps) {
  return (
    <div className="space-y-3 rounded-calm bg-white p-4 shadow-soft">
      {Array.from({ length: count }).map((_, i) => (
        <SessionRowSkeleton key={i} />
      ))}
    </div>
  );
}
