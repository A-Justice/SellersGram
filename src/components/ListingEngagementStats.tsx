type Props = {
  viewCount?: number;
  callInterestCount?: number;
  className?: string;
  /** When true, always show view count (including 0) for sellers. */
  showEmpty?: boolean;
};

export function ListingEngagementStats({
  viewCount = 0,
  callInterestCount = 0,
  className = "",
  showEmpty = false,
}: Props) {
  if (!showEmpty && !viewCount && !callInterestCount) return null;

  const viewsLabel = `${viewCount.toLocaleString()} view${viewCount === 1 ? "" : "s"}`;

  return (
    <p className={`text-sm text-muted ${className}`}>
      {showEmpty || viewCount > 0 ? viewsLabel : null}
      {(showEmpty || viewCount > 0) && callInterestCount > 0 ? " · " : null}
      {callInterestCount > 0
        ? `${callInterestCount.toLocaleString()} call interest${
            callInterestCount === 1 ? "" : "s"
          }`
        : null}
    </p>
  );
}
