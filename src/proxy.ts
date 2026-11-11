import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isIndexableHost, isProductionSite } from "@/lib/env";

function requestHost(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwarded) return forwarded.split(":")[0] || forwarded;
  const host = request.headers.get("host")?.split(":")[0];
  if (host) return host;
  return request.nextUrl.hostname;
}

/**
 * Staging / preview / localhost must never compete with production in Google.
 * On Firebase App Hosting the edge Host may be the *.hosted.app name even for
 * vendorsgram.com — so also trust NEXT_PUBLIC_APP_URL for production deploys.
 */
export function proxy(request: NextRequest) {
  if (isProductionSite() || isIndexableHost(requestHost(request))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
