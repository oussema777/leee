import { Skeleton, SkeletonCard } from "@/components/shared/SkeletonBlock";

export default function BlogLoading() {
  return (
    <>
      <div className="bg-gradient-to-b from-gray-200 to-gray-100 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-9 w-40 rounded" />
          <Skeleton className="h-4 w-80 rounded" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-32 rounded" />
          ))}
        </div>
        {/* Featured skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 mb-12 border border-gray-100">
          <Skeleton className="min-h-[320px]" />
          <div className="p-10 space-y-4">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-8 w-4/5 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-3/4 rounded" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
