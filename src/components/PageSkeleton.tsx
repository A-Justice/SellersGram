/** Shared shimmer placeholders — uses the global `.skeleton` animation. */

export function PageSkeleton() {
  return (
    <div
      className="mx-auto max-w-lg space-y-4 py-8"
      aria-busy="true"
      aria-label="Loading"
    >
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

export function ListingGridSkeleton({
  count = 8,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5 ${className}`}
      aria-busy="true"
      aria-label="Loading ads"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="skeleton aspect-[4/5] w-full rounded-[22px]" />
          <div className="skeleton h-3 w-[75%] rounded-full" />
          <div className="skeleton h-3 w-[45%] rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div
      className="grid min-w-0 max-w-full gap-8 lg:grid-cols-[1.15fr_0.85fr]"
      aria-busy="true"
      aria-label="Loading listing"
    >
      <div className="min-w-0 space-y-3">
        <div className="skeleton aspect-[4/3] w-full max-h-[min(52vh,320px)] rounded-[28px] sm:max-h-none sm:aspect-[5/4]" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton size-16 shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="min-w-0 space-y-5">
        <div className="skeleton h-3 w-40 rounded-full" />
        <div className="skeleton h-10 w-full max-w-md rounded-full" />
        <div className="skeleton h-8 w-36 rounded-full" />
        <div className="skeleton h-4 w-48 rounded-full" />
        <div className="skeleton h-40 w-full rounded-[24px]" />
        <div className="space-y-2">
          <div className="skeleton h-6 w-28 rounded-full" />
          <div className="skeleton h-3 w-full rounded-full" />
          <div className="skeleton h-3 w-full rounded-full" />
          <div className="skeleton h-3 w-2/3 max-w-[70%] rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SellerPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-8 pb-8"
      aria-busy="true"
      aria-label="Loading seller"
    >
      <div className="skeleton h-40 w-full rounded-[28px] sm:h-44" />
      <div className="space-y-4">
        <div className="skeleton h-8 w-40 rounded-full" />
        <div className="skeleton h-4 w-56 rounded-full" />
        <ListingGridSkeleton count={4} />
      </div>
    </div>
  );
}

export function AccountShellSkeleton() {
  return (
    <div
      className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 px-4 py-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6 lg:px-6"
      aria-busy="true"
      aria-label="Loading account"
    >
      <div className="hidden space-y-2 lg:block">
        <div className="skeleton h-4 w-24 rounded-full" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-11 w-full rounded-2xl" />
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-4">
        <div className="skeleton h-8 w-48 rounded-full" />
        <div className="skeleton h-4 w-64 max-w-full rounded-full" />
        <div className="skeleton h-56 w-full rounded-[28px]" />
      </div>
    </div>
  );
}

export function HomeHeroSkeleton() {
  return (
    <div
      className="skeleton h-[22rem] w-full rounded-[32px] sm:h-[26rem]"
      aria-busy="true"
      aria-label="Loading"
    />
  );
}
