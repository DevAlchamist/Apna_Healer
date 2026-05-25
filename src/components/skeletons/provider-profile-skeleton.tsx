import { Skeleton } from "@/components/ui/skeleton";

export function ProviderProfileSkeleton() {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,430px)]">
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full rounded-calm md:h-[380px]" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="rounded-calm border border-accent/70 bg-white p-6 shadow-soft">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-10 w-full rounded-calm" />
        <Skeleton className="mt-3 h-10 w-full rounded-calm" />
        <Skeleton className="mt-6 h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
