import { NextResponse } from "next/server";
import { isOwnerUid } from "@/lib/owner";
import { deleteBlobs, isAzureConfigured } from "@/lib/server/azure-blob";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as {
      urls?: string[];
      sellerId?: string;
    };
    if (
      body.sellerId &&
      body.sellerId !== user.uid &&
      !isOwnerUid(user.uid)
    ) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }
    if (isAzureConfigured() && body.urls?.length) {
      await deleteBlobs(body.urls);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    const status = message === "Not signed in" || message === "Invalid session" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
