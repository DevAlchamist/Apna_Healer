import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePageSkeleton() {
  return (
    <div className="space-y-6 pb-10 md:space-y-8">
      <div className="overflow-hidden rounded-[1.75rem] border border-[#2D5A4C]/8 bg-[#fdfbf7] shadow-[0_20px_50px_-28px_rgba(45,90,76,0.2)]">
        <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,200px)_1fr] md:p-10">
          <Skeleton className="mx-auto h-44 w-44 shrink-0 rounded-full md:mx-0" />
          <div className="space-y-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-56 max-w-full" />
            <Skeleton className="h-20 w-full rounded-[1.25rem]" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-11 w-32 rounded-full" />
              <Skeleton className="h-11 w-36 rounded-full" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 border-t border-[#2D5A4C]/8 bg-white/50 px-6 py-4 sm:grid-cols-3 md:px-10">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-48 sm:ml-auto" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-9 w-16" />
          </div>
        ))}
        <div className="rounded-[1.25rem] bg-[#ebe4d8] p-5 sm:col-span-2 xl:col-span-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mx-auto mt-4 h-24 w-24 rounded-full" />
          <Skeleton className="mx-auto mt-3 h-3 w-40" />
          <Skeleton className="mx-auto mt-4 h-10 w-36 rounded-full" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.35rem] bg-[#ebe4d8]/80 p-6 md:p-8">
          <Skeleton className="h-7 w-40" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-2 w-20" />
                <Skeleton className="h-5 w-full max-w-48" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-black/[0.04] md:p-8">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
          <Skeleton className="mt-6 h-16 w-32" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-2 w-16" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((col) => (
          <div key={`profile-col-${col}`} className="rounded-[1.35rem] bg-white p-6 shadow-sm ring-1 ring-black/[0.04] md:p-8">
            <div className="flex justify-between">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="mt-6 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Skeleton className="h-40 w-full rounded-[1.5rem]" />
    </div>
  );
}
