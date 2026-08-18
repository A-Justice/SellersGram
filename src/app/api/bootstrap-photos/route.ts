import { NextResponse } from "next/server";
import { SEED_LISTINGS } from "@/data/seed";
import { isOwnerUid } from "@/lib/owner";
import { isAzureConfigured, uploadFromUrl } from "@/lib/server/azure-blob";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    if (!isOwnerUid(user.uid)) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    const photos: Record<string, string[]> = {};
    const azure = isAzureConfigured();

    await Promise.all(
      SEED_LISTINGS.map(async (listing) => {
        if (!azure) {
          photos[listing.id] = listing.photoUrls;
          return;
        }
        const urls: string[] = [];
        for (const source of listing.photoUrls.slice(0, 2)) {
          urls.push(await uploadFromUrl(user.uid, source, `listings/${listing.id}`));
        }
        photos[listing.id] = urls;
      }),
    );

    return NextResponse.json({ photos, azure });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bootstrap failed";
    const status = message === "Not signed in" || message === "Invalid session" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
