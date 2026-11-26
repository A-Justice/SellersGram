import { buildListingOgJpeg, ogImageResponse } from "@/lib/server/og-listing-image";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

/** Stable JPEG URL for Facebook / WhatsApp (`…/api/og/listing/{id}`). */
export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const jpeg = await buildListingOgJpeg(id);
  return ogImageResponse(jpeg);
}
