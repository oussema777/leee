import { Skeleton, SkeletonCard } from "@/components/shared/SkeletonBlock";

export default function ProgramsLoading() {
  return (
    <>
      <div className="bg-gradient-to-b from-gray-200 to-gray-100 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-9 w-56 rounded" />
          <Skeleton className="h-4 w-96 rounded" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-2 mb-8 flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-36 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
