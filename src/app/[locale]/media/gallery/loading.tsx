import { Skeleton } from "@/components/shared/SkeletonBlock";

export default function GalleryLoading() {
  return (
    <>
      <div className="bg-gradient-to-b from-gray-200 to-gray-100 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-9 w-64 rounded" />
          <Skeleton className="h-4 w-80 rounded" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-32 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded" />
          ))}
        </div>
      </div>
    </>
  );
}
