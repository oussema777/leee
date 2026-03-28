import { SkeletonHero, Skeleton, SkeletonText } from "@/components/shared/SkeletonBlock";

export default function BlogPostLoading() {
  return (
    <>
      <SkeletonHero />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <SkeletonText lines={4} />
        <Skeleton className="h-6 w-2/3 rounded" />
        <SkeletonText lines={5} />
        <Skeleton className="h-6 w-1/2 rounded" />
        <SkeletonText lines={3} />
        {/* Author card skeleton */}
        <div className="bg-gray-50 p-6 flex items-center gap-4 mt-8">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
      </div>
    </>
  );
}
