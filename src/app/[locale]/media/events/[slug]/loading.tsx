import { SkeletonHero, Skeleton, SkeletonText } from "@/components/shared/SkeletonBlock";

export default function EventDetailLoading() {
  return (
    <>
      <SkeletonHero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonText lines={6} />
            <Skeleton className="h-4 w-full rounded mt-4" />
            <SkeletonText lines={4} />
          </div>
          <div>
            <Skeleton className="h-80 w-full rounded" />
          </div>
        </div>
      </div>
    </>
  );
}
