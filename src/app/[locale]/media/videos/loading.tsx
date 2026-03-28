import { Skeleton } from "@/components/shared/SkeletonBlock";

export default function VideosLoading() {
  return (
    <>
      <div className="bg-gradient-to-b from-gray-200 to-gray-100 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-9 w-48 rounded" />
          <Skeleton className="h-4 w-96 rounded" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-32 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100">
              <Skeleton className="aspect-video" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-4/5 rounded" />
                <Skeleton className="h-3 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
