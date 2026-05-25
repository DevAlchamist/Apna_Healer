import { Skeleton } from "@/components/ui/skeleton";

type TableSkeletonProps = {
  columns?: number;
  rows?: number;
  hasAvatarColumn?: boolean;
  className?: string;
};

export function TableSkeleton({
  columns = 5,
  rows = 6,
  hasAvatarColumn = false,
  className = "",
}: TableSkeletonProps) {
  return (
    <div className={`overflow-hidden rounded-calm border border-accent/70 bg-white shadow-soft ${className}`.trim()}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#ebe6de]">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-5 py-4 text-left">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row} className="border-b border-[#f4f0ea] last:border-0">
              {Array.from({ length: columns }).map((_, col) => (
                <td key={col} className="px-5 py-4">
                  {hasAvatarColumn && col === 0 ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-2 w-20" />
                      </div>
                    </div>
                  ) : (
                    <Skeleton className="h-3 w-full max-w-[8rem]" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
