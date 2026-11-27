import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isIndexableHost, isProductionSite } from "@/lib/env";

/** Crawlers that do not execute JS / wait for streamed head updates. */
const SOCIAL_BOT =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|TelegramBot|SkypeUriPreview|Pinterest|redditbot|Quora Link Preview|Iframely|Embedly|vkShare|W3C_Validator/i;

function requestHost(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwarded) return forwarded.split(":")[0] || forwarded;
  const host = request.headers.get("host")?.split(":")[0];
  if (host) return host;
  return request.nextUrl.hostname;
}

function rewriteSocialListing(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!SOCIAL_BOT.test(ua)) return null;

  const match = request.nextUrl.pathname.match(/^\/listing\/([^/]+)\/?$/);
  if (!match) return null;

  const url = request.nextUrl.clone();
  url.pathname = `/crawl/listing/${match[1]}`;
  return NextResponse.rewrite(url);
}

/**
 * Staging / preview / localhost must never compete with production in Google.
 * On Firebase App Hosting the edge Host may be the *.hosted.app name even for
 * vendorsgram.com — so also trust NEXT_PUBLIC_APP_URL for production deploys.
 *
 * Social bots get a tiny HTML document with OG tags in the real head — App
 * Router can otherwise stream meta after </head>, which Facebook ignores.
 */
export function proxy(request: NextRequest) {
  const social = rewriteSocialListing(request);
  if (social) return social;

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
