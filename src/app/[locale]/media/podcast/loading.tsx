import { Skeleton } from "@/components/shared/SkeletonBlock";

export default function PodcastLoading() {
  return (
    <>
      {/* Page Header Skeleton */}
      <div className="bg-gradient-to-b from-gray-200 to-gray-100 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-9 w-52 rounded" />
          <Skeleton className="h-4 w-96 rounded" />
        </div>
      </div>
      {/* Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-32 rounded" />
          ))}
        </div>
        {/* Featured skeleton */}
        <Skeleton className="h-[360px] w-full rounded mb-12" />
        {/* Episode list skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border border-gray-100">
              <Skeleton className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded" />
              <div className="flex-1 space-y-2 py-2">
                <Skeleton className="h-3 w-32 rounded" />
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
