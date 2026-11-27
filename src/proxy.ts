import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isIndexableHost, isProductionSite } from "@/lib/env";

/**
 * Crawlers that do not wait for streamed &lt;head&gt; updates.
 * Keep this file free of Firebase / heavy imports — App Hosting was
 * dropping the bot branch when proxy pulled in Firestore.
 */
const SOCIAL_BOT =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|TelegramBot|SkypeUriPreview|Pinterest|redditbot|Quora Link Preview|Iframely|Embedly|vkShare|W3C_Validator/i;

function requestHost(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwarded) return forwarded.split(":")[0] || forwarded;
  const host = request.headers.get("host")?.split(":")[0];
  if (host) return host;
  return request.nextUrl.hostname;
}

/**
 * 302 → /crawl/listing/[id] (OG tags in the real head).
 * og:url inside that HTML stays the listing canonical so shares aggregate.
 */
function socialListingRedirect(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!SOCIAL_BOT.test(ua)) return null;

  const match = request.nextUrl.pathname.match(/^\/listing\/([^/]+)\/?$/);
  if (!match) return null;

  const url = request.nextUrl.clone();
  url.pathname = `/crawl/listing/${match[1]}`;
  const response = NextResponse.redirect(url, 302);
  response.headers.set("X-Vg-Og", "redirect-crawl");
  return response;
}

/**
 * Staging / preview / localhost must never compete with production in Google.
 * On Firebase App Hosting the edge Host may be the *.hosted.app name even for
 * vendorsgram.com — so also trust NEXT_PUBLIC_APP_URL for production deploys.
 */
export function proxy(request: NextRequest) {
  const social = socialListingRedirect(request);
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
    // Always run for listing pages (bot redirect) + everything else for robots tag.
    "/listing/:id",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
