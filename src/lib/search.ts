import type { Listing } from "@/data/types";
import { categoryById, SUBCATEGORIES } from "@/lib/categories";
import { regionById } from "@/lib/regions";

function tokenize(query: string) {
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function distance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = current;
    }
  }
  return row[b.length];
}

function tokenScore(token: string, text: string) {
  if (!text) return 0;
  if (text.includes(token)) return 1;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.some((word) => word.startsWith(token) || token.startsWith(word))) {
    return 0.75;
  }
  if (token.length < 4) return 0;
  const allowed = token.length >= 6 ? 2 : 1;
  if (words.some((word) => Math.abs(word.length - token.length) <= 2 && distance(word, token) <= allowed)) {
    return 0.45;
  }
  return 0;
}

export function cosine(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function listingText(listing: Listing) {
  const category = categoryById(listing.categoryId);
  const subcategory = SUBCATEGORIES[listing.categoryId]?.find(
    (item) => item.id === listing.subcategoryId,
  );
  const region = regionById(listing.regionId);

  return {
    title: listing.title.toLowerCase(),
    description: listing.description.toLowerCase(),
    place: `${listing.city} ${region?.name || ""}`.toLowerCase(),
    category: [
      category?.name,
      category?.hint,
      subcategory?.name,
      listing.categoryId,
      listing.subcategoryId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
    extra: `${listing.condition} ${listing.seller.name}`.toLowerCase(),
  };
}

export function searchListings(
  listings: Listing[],
  query: string,
  regionId = "",
  queryEmbedding?: number[] | null,
) {
  const scoped = regionId
    ? listings.filter((listing) => listing.regionId === regionId)
    : listings;
  const tokens = tokenize(query);
  if (!tokens.length) return scoped;

  return scoped
    .map((listing) => {
      const fields = listingText(listing);
      let score = 0;
      let hits = 0;
      for (const token of tokens) {
        const title = tokenScore(token, fields.title);
        const category = tokenScore(token, fields.category);
        const place = tokenScore(token, fields.place);
        const description = tokenScore(token, fields.description);
        const extra = tokenScore(token, fields.extra);
        const best = Math.max(title, category, place, description, extra);
        if (best <= 0) continue;
        hits += 1;
        score +=
          title * 50 +
          category * 28 +
          place * 22 +
          description * 12 +
          extra * 8;
      }
      if (hits === tokens.length) score += 40;

      const similar =
        queryEmbedding?.length && listing.embedding?.length
          ? cosine(queryEmbedding, listing.embedding)
          : 0;
      if (similar >= 0.22) score += similar * 140;
      if (!hits && similar < 0.28) return null;
      return { listing, score, hits, similar };
    })
    .filter(
      (item): item is { listing: Listing; score: number; hits: number; similar: number } =>
        Boolean(item),
    )
    .sort((a, b) => b.score - a.score || b.similar - a.similar || b.hits - a.hits)
    .map((item) => item.listing);
}
