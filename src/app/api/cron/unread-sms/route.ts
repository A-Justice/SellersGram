import { NextResponse } from "next/server";
import { adminReady } from "@/lib/server/firebase-admin";
import { sendUnreadInboxSmsReminders } from "@/lib/server/unread-sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily unread-inbox SMS reminders.
 * Schedule with Cloud Scheduler at 08:00 Africa/Accra:
 *   POST https://<host>/api/cron/unread-sms
 *   Authorization: Bearer <CRON_SECRET>
 */
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  if (header === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!adminReady()) {
    return NextResponse.json({ error: "Firebase is not configured." }, { status: 500 });
  }

  const summary = await sendUnreadInboxSmsReminders();
  return NextResponse.json({ ok: true, ...summary });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
