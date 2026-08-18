export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-8" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-10 w-48 rounded-full" />
      <div className="skeleton h-4 w-72 max-w-full rounded-full" />
      <div className="skeleton mt-6 h-64 w-full rounded-[28px]" />
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-12 rounded-full" />
        <div className="skeleton h-12 rounded-full" />
      </div>
    </div>
  );
}
