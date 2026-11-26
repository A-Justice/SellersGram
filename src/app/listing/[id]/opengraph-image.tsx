import { buildListingOgJpeg, OG_SIZE, ogImageResponse } from "@/lib/server/og-listing-image";

export const runtime = "nodejs";
export const alt = "Vendors Gram listing";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

type Props = { params: Promise<{ id: string }> };

/** File-convention OG route — same JPEG as /api/og/listing/[id]. */
export default async function OgImage({ params }: Props) {
  const { id } = await params;
  return ogImageResponse(await buildListingOgJpeg(id));
}
