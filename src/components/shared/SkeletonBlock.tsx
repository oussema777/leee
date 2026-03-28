import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]",
        className
      )}
      style={{ animation: "shimmer 1.5s ease-in-out infinite" }}
    />
  );
}

export function SkeletonText({ className, lines = 3 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-3.5 rounded",
            i === lines - 1 ? "w-3/5" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 overflow-hidden">
      <Skeleton className="aspect-[16/9]" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-5 w-4/5 rounded" />
        <SkeletonText lines={2} />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative min-h-[420px] bg-gradient-to-t from-gray-300 via-gray-200 to-gray-100 animate-pulse">
      <div className="absolute bottom-0 w-full p-8 space-y-4">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-10 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
    </div>
  );
}
