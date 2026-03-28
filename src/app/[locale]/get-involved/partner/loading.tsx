import { Skeleton } from "@/components/shared/SkeletonBlock";

export default function PartnerLoading() {
  return (
    <>
      {/* Page Header Skeleton */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-56 rounded" />
          <Skeleton className="h-10 w-[500px] max-w-full rounded" />
          <Skeleton className="h-4 w-80 max-w-full rounded" />
        </div>
      </div>

      {/* Option Cards Skeleton */}
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <Skeleton className="h-8 w-72 mx-auto rounded mb-10" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-8 flex gap-6">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-48 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Stats Skeleton */}
      <div className="bg-surface-secondary py-12 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8 text-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-10 w-20 mx-auto rounded" />
              <Skeleton className="h-4 w-32 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
