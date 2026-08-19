import { ExternalLink, Play } from "lucide-react";
import { parseVideoUrl } from "@/lib/video-url";

type Props = {
  url: string;
};

export function ListingVideo({ url }: Props) {
  const parsed = parseVideoUrl(url);
  if (!parsed) return null;

  if (parsed.kind === "youtube") {
    return (
      <div className="overflow-hidden rounded-[24px] bg-ink shadow-[0_0_0_1px_var(--color-line)]">
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${parsed.id}`}
            title="Listing video"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <a
      href={parsed.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-[24px] bg-paper px-5 py-4 shadow-[0_0_0_1px_var(--color-line)] transition hover:shadow-[0_0_0_1px_var(--color-ink)]"
    >
      <span className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-canvas text-accent">
          <Play className="size-4 fill-current" />
        </span>
        <span>
          <span className="block text-sm font-medium">Watch video</span>
          <span className="block truncate text-xs text-muted">{parsed.url}</span>
        </span>
      </span>
      <ExternalLink className="size-4 shrink-0 text-muted" />
    </a>
  );
}
