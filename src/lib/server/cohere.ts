const COHERE_URL = "https://api.cohere.com/v2/embed";
const MODEL = "embed-v4.0";
export const EMBED_DIMENSION = 256;

export type EmbedInputType = "search_document" | "search_query";

export function isCohereConfigured() {
  return Boolean(process.env.COHERE_API_KEY);
}

export async function embedTexts(texts: string[], inputType: EmbedInputType) {
  const key = process.env.COHERE_API_KEY;
  if (!key) throw new Error("Cohere is not configured.");

  const cleaned = texts.map((text) => text.trim()).filter(Boolean);
  if (!cleaned.length) return [];

  const response = await fetch(COHERE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      texts: cleaned,
      input_type: inputType,
      embedding_types: ["float"],
      output_dimension: EMBED_DIMENSION,
    }),
  });

  const payload = (await response.json()) as {
    embeddings?: { float?: number[][] };
    message?: string;
  };

  if (!response.ok || !payload.embeddings?.float) {
    throw new Error(payload.message || "Cohere embed failed.");
  }

  return payload.embeddings.float;
}
