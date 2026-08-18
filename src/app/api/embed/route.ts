import { NextResponse } from "next/server";
import { embedTexts, isCohereConfigured, type EmbedInputType } from "@/lib/server/cohere";

export const runtime = "nodejs";

const MAX_TEXTS = 32;
const MAX_CHARS = 2000;

export async function POST(request: Request) {
  try {
    if (!isCohereConfigured()) {
      return NextResponse.json(
        { error: "Cohere is not configured yet." },
        { status: 501 },
      );
    }

    const body = (await request.json()) as {
      text?: string;
      texts?: string[];
      inputType?: EmbedInputType;
    };
    const inputType: EmbedInputType =
      body.inputType === "search_query" ? "search_query" : "search_document";
    const texts = (body.texts?.length ? body.texts : [body.text || ""])
      .map((text) => String(text || "").trim().slice(0, MAX_CHARS))
      .filter(Boolean);

    if (!texts.length) {
      return NextResponse.json({ error: "Nothing to embed." }, { status: 400 });
    }
    if (inputType === "search_query" && texts.length > 1) {
      return NextResponse.json({ error: "One search query at a time." }, { status: 400 });
    }
    if (texts.length > MAX_TEXTS) {
      return NextResponse.json({ error: `Up to ${MAX_TEXTS} texts at a time.` }, { status: 400 });
    }

    const embeddings = await embedTexts(texts, inputType);
    return NextResponse.json({
      embeddings,
      embedding: embeddings[0] || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Embed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
