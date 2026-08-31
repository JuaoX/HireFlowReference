import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CandidatesCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className="flex items-center justify-between p-3 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
