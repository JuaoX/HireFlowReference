import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MetricCardSkeleton() {
  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="w-4 h-4 rounded" />
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-10 w-16" />
      </CardContent>
    </Card>
  );
}
