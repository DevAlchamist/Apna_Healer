import { Skeleton } from "@/components/ui/skeleton";

export function SettingsBlocksSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-calm bg-white p-6 shadow-soft">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-10 w-full rounded-calm" />
          <Skeleton className="mt-3 h-10 w-full rounded-calm" />
        </div>
      ))}
    </div>
  );
}
