type Props = {
  viewCount?: number;
  callInterestCount?: number;
  className?: string;
};

export function ListingEngagementStats({
  viewCount = 0,
  callInterestCount = 0,
  className = "",
}: Props) {
  if (!viewCount && !callInterestCount) return null;

  return (
    <p className={`text-sm text-muted ${className}`}>
      {viewCount > 0 ? `${viewCount.toLocaleString()} view${viewCount === 1 ? "" : "s"}` : null}
      {viewCount > 0 && callInterestCount > 0 ? " · " : null}
      {callInterestCount > 0
        ? `${callInterestCount.toLocaleString()} call interest${
            callInterestCount === 1 ? "" : "s"
          }`
        : null}
    </p>
  );
}
