import { Skeleton } from "@/components/ui/skeleton";

export default function BoardLoading() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="min-w-[280px] flex-1 space-y-3">
            <Skeleton className="h-8" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-32" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
