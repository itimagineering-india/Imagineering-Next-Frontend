import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ServiceDetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Breadcrumbs Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="space-y-6">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="mb-8">
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Fields Skeleton */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
