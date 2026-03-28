import { Skeleton } from "@/components/shared/SkeletonBlock";

export default function TestimonialsLoading() {
  return (
    <>
      <div className="bg-gradient-to-b from-gray-200 to-gray-100 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-9 w-56 rounded" />
          <Skeleton className="h-4 w-96 rounded" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-32 rounded" />
          ))}
        </div>
        {/* Featured skeleton */}
        <Skeleton className="h-[400px] w-full rounded mb-10" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 p-6 space-y-3">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
              <div className="flex items-center gap-3 pt-3">
                <Skeleton className="w-11 h-11 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-2.5 w-16 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
