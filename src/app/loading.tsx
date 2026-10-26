import { ListingGridSkeleton, PageSkeleton } from "@/components/PageSkeleton";

export default function Loading() {
  return (
    <div className="space-y-8 py-2">
      <div className="skeleton h-48 w-full rounded-[32px] sm:h-64" />
      <PageSkeleton />
      <ListingGridSkeleton count={4} />
    </div>
  );
}
