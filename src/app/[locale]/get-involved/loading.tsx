import { Skeleton, SkeletonCard } from "@/components/shared/SkeletonBlock";

export default function GetInvolvedLoading() {
  return (
    <>
      {/* Page Header Skeleton */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-10 w-[480px] max-w-full rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Skeleton className="h-5 w-[480px] max-w-full mx-auto rounded mb-14" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
