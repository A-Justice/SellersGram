export type ParsedVideo =
  | { kind: "youtube"; id: string; url: string }
  | { kind: "link"; url: string };

export function parseVideoUrl(raw: string): ParsedVideo | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return id ? { kind: "youtube", id, url: url.toString() } : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/")[2];
        return id ? { kind: "youtube", id, url: url.toString() } : null;
      }
      const fromQuery = url.searchParams.get("v");
      const fromEmbed = url.pathname.match(/\/embed\/([^/?]+)/)?.[1];
      const id = fromQuery || fromEmbed;
      return id ? { kind: "youtube", id, url: url.toString() } : null;
    }

    return { kind: "link", url: url.toString() };
  } catch {
    return null;
  }
}

export function normalizeVideoUrlInput(raw: string): string | null {
  const parsed = parseVideoUrl(raw);
  if (!raw.trim()) return null;
  return parsed?.url ?? null;
}
