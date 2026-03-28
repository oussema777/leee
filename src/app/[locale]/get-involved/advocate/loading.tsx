import { Skeleton } from "@/components/shared/SkeletonBlock";

export default function AdvocateLoading() {
  return (
    <>
      {/* Page Header Skeleton */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-56 rounded" />
          <Skeleton className="h-10 w-64 max-w-full rounded" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
        </div>
      </div>

      {/* Advocacy Items Skeleton */}
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-8 animate-pulse">
        <Skeleton className="h-8 w-64 mx-auto rounded mb-10" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-8 flex gap-6">
            <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-56 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-4 w-36 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Quote Skeleton */}
      <div className="bg-surface-secondary py-16 px-4 animate-pulse">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <Skeleton className="h-8 w-full rounded" />
          <Skeleton className="h-8 w-3/4 mx-auto rounded" />
          <Skeleton className="h-4 w-32 mx-auto rounded mt-4" />
        </div>
      </div>
    </>
  );
}
