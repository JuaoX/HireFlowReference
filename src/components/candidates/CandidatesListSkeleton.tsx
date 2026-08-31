import { Skeleton } from "@/components/ui/skeleton";

export const CandidatesListSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Table header skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 rounded-lg">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
      
      {/* Table rows skeleton */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-4 bg-muted rounded-lg"
        >
          <div className="flex items-center gap-3 w-48">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-4 ml-auto" />
        </div>
      ))}
    </div>
  );
};
