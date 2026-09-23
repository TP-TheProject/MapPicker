import { Skeleton } from "@/components/ui/skeleton";

interface MapGridSkeletonProps {
  count?: number;
}

/** Placeholder grid shown while the map list is loading — matches the eventual card layout. */
export function MapGridSkeleton({ count = 8 }: MapGridSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1440px]:grid-cols-4 md:gap-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="aspect-video w-full rounded-md" />
      ))}
    </div>
  );
}
