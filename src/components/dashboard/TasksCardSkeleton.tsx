import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TasksCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-16" />
      </CardHeader>
      <CardContent className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="p-3 rounded-lg bg-muted"
          >
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
