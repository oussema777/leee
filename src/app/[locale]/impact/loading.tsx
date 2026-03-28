import { Skeleton, SkeletonCard } from "@/components/shared/SkeletonBlock";

export default function ImpactLoading() {
  return (
    <>
      {/* Page Header Skeleton */}
      <div className="bg-gradient-to-b from-gray-200 to-gray-100 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-9 w-[400px] rounded" />
          <Skeleton className="h-4 w-[500px] rounded" />
        </div>
      </div>

      {/* Dashboard Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-6 w-48 rounded mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-10 w-10 rounded-full mx-auto" />
              <Skeleton className="h-8 w-20 mx-auto rounded" />
              <Skeleton className="h-3 w-24 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Journey Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-surface-secondary">
        <Skeleton className="h-8 w-56 mx-auto rounded mb-8" />
        <div className="flex gap-8 justify-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 space-y-2 text-center">
              <Skeleton className="h-14 w-14 rounded-full mx-auto" />
              <Skeleton className="h-6 w-16 mx-auto rounded" />
              <Skeleton className="h-3 w-20 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Stories Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-6 w-80 mx-auto rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>

      {/* Lessons Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-surface-secondary">
        <Skeleton className="h-8 w-56 mx-auto rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>

      {/* Downloads Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-8 w-56 mx-auto rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
