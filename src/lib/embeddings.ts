import type { Listing } from "@/data/types";
import { categoryById, SUBCATEGORIES } from "@/lib/categories";
import { regionById } from "@/lib/regions";

export type EmbedInputType = "search_document" | "search_query";

export function listingEmbedText(
  listing: Pick<
    Listing,
    | "title"
    | "description"
    | "city"
    | "categoryId"
    | "subcategoryId"
    | "regionId"
    | "condition"
    | "attributes"
  >,
) {
  const category = categoryById(listing.categoryId);
  const subcategory = SUBCATEGORIES[listing.categoryId]?.find(
    (item) => item.id === listing.subcategoryId,
  );
  const region = regionById(listing.regionId);
  const attributeText = listing.attributes
    ? Object.values(listing.attributes).filter(Boolean).join(". ")
    : "";
  return [
    listing.title,
    listing.description,
    category?.name,
    category?.hint,
    subcategory?.name,
    listing.condition,
    listing.city,
    region?.name,
    attributeText,
  ]
    .filter(Boolean)
    .join(". ");
}

export async function embedQuery(text: string) {
  const embeddings = await requestEmbeddings([text], "search_query");
  return embeddings[0] || null;
}

export async function embedDocuments(texts: string[]) {
  return requestEmbeddings(texts, "search_document");
}

async function requestEmbeddings(texts: string[], inputType: EmbedInputType) {
  const cleaned = texts.map((text) => text.trim()).filter(Boolean);
  if (!cleaned.length) return [];

  const response = await fetch("/api/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: cleaned, inputType }),
  });
  const payload = (await response.json().catch(() => null)) as {
    embeddings?: number[][];
    error?: string;
  } | null;
  if (!response.ok || !payload?.embeddings) return [];
  return payload.embeddings;
}
