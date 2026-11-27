import { buildListingOgJpeg, ogImageResponse } from "@/lib/server/og-listing-image";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

/** Public JPEG for crawlers: /og/listing/{id}.jpg → this route. */
export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  // Strip optional .jpg if rewrite didn't
  const listingId = id.replace(/\.jpg$/i, "");
  return ogImageResponse(await buildListingOgJpeg(listingId));
}
