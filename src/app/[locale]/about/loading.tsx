import { Skeleton, SkeletonCard } from "@/components/shared/SkeletonBlock";

export default function AboutLoading() {
  return (
    <>
      {/* Page Header Skeleton */}
      <div className="bg-gradient-to-b from-gray-200 to-gray-100 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-9 w-96 rounded" />
          <Skeleton className="h-4 w-[500px] rounded" />
        </div>
      </div>

      {/* Timeline Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-8 w-48 mx-auto rounded mb-8" />
        <div className="flex gap-8 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 space-y-3">
              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
              <Skeleton className="h-5 w-32 mx-auto rounded" />
              <Skeleton className="h-3 w-40 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Team Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-surface-secondary">
        <Skeleton className="h-8 w-40 mx-auto rounded mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>

      {/* Values Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-8 w-56 mx-auto rounded mb-8" />
        <div className="space-y-8">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded" />
          ))}
        </div>
      </div>

      {/* Strategy Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-surface-secondary">
        <Skeleton className="h-8 w-64 mx-auto rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
