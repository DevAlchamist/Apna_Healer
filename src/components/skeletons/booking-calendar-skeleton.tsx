import { Skeleton } from "@/components/ui/skeleton";

export function BookingCalendarSkeleton() {
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-[1.05fr_1fr]">
      <Skeleton className="h-64 rounded-2xl" />
      <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-4 h-4 w-32" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
