import { Skeleton } from "@/components/shared/SkeletonBlock";

export default function PodcastEpisodeLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="relative min-h-[400px] md:min-h-[460px] bg-gray-200 animate-pulse">
        <div className="absolute bottom-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-32">
          <Skeleton className="h-3 w-48 rounded mb-5" />
          <Skeleton className="h-6 w-32 rounded mb-3" />
          <Skeleton className="h-10 w-3/4 rounded mb-5" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Skeleton className="h-20 w-full rounded mb-10" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </div>
    </>
  );
}
