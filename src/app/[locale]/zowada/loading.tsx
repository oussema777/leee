import { Skeleton, SkeletonCard } from "@/components/shared/SkeletonBlock";

export default function ZowadaLoading() {
  return (
    <>
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-600 py-20 md:py-32 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
          <Skeleton className="h-12 w-96 mx-auto rounded bg-white/20" />
          <Skeleton className="h-5 w-[500px] mx-auto rounded bg-white/10" />
          <div className="flex gap-4 justify-center mt-8">
            <Skeleton className="h-12 w-40 rounded-lg bg-white/20" />
            <Skeleton className="h-12 w-40 rounded-lg bg-white/10" />
          </div>
          <Skeleton className="h-[500px] w-64 mx-auto rounded-[40px] bg-white/10 mt-12" />
        </div>
      </div>

      {/* Features Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-8 w-64 mx-auto rounded mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>

      {/* Conditions Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-surface-secondary">
        <Skeleton className="h-8 w-72 mx-auto rounded mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-2 p-6">
              <Skeleton className="h-8 w-8 rounded-full mx-auto" />
              <Skeleton className="h-5 w-24 mx-auto rounded" />
              <Skeleton className="h-3 w-32 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Stories + Partners Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-8 w-48 mx-auto rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>

      {/* Vision Skeleton */}
      <div className="bg-gray-700 py-16 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto rounded bg-white/20 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-48 mx-auto rounded bg-white/20" />
                <Skeleton className="h-3 w-56 mx-auto rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
