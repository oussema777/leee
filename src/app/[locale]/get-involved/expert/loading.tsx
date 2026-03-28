import { Skeleton } from "@/components/shared/SkeletonBlock";

export default function ExpertLoading() {
  return (
    <>
      {/* Page Header Skeleton */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-56 rounded" />
          <Skeleton className="h-10 w-72 max-w-full rounded" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
        </div>
      </div>

      {/* Roles Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse">
        <Skeleton className="h-8 w-64 mx-auto rounded mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 text-center space-y-4">
              <Skeleton className="h-10 w-10 mx-auto rounded-full" />
              <Skeleton className="h-6 w-32 mx-auto rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Time Banking Skeleton */}
      <div className="bg-surface-secondary py-16 px-4 animate-pulse">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10 space-y-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-6 w-56 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </div>
    </>
  );
}
