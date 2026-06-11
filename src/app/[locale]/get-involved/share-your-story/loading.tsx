import { Skeleton } from "@/components/shared/SkeletonBlock";

export default function ShareYourStoryLoading() {
  return (
    <>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-10 w-[420px] max-w-full rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
        <Skeleton className="h-8 w-72 mx-auto rounded" />
        <Skeleton className="h-4 w-96 max-w-full mx-auto rounded" />
        <div className="border border-gray-100 rounded-xl p-8 space-y-5 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </>
  );
}
