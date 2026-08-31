import { Skeleton } from "@/components/ui/skeleton";

export function JobListingsTableSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden">
      <div className="p-4">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="px-4 pb-4 space-y-2">
        {/* Column Headers */}
        <div className="px-4 flex items-center gap-8">
          <div className="w-[243px]">
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-3 w-28" />
          </div>
        </div>

        {/* Job Rows */}
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className="p-4 bg-muted rounded-lg flex items-center gap-8"
          >
            <div className="w-[243px]">
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex-1 flex items-center gap-[-4px]">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-6 h-6 rounded-full -ml-1" />
              <Skeleton className="w-6 h-6 rounded-full -ml-1" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-4 w-4 absolute right-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
