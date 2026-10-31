import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isIndexableHost } from "@/lib/env";

/**
 * Staging / preview / localhost must never compete with production in Google.
 * X-Robots-Tag is the hard stop even if a page sets robots index:true.
 */
export function proxy(request: NextRequest) {
  if (isIndexableHost(request.nextUrl.hostname)) {
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
