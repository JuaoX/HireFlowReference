import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function JobListingsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-4 pb-2 border-b">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-28 ml-auto" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className="grid grid-cols-4 gap-4 py-3 px-2 rounded-lg"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <div className="flex items-center gap-2 justify-end">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
