import { NextResponse } from "next/server";
import webpush from "web-push";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

type PushSub = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

function vapidReady() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
}

export async function POST(request: Request) {
  try {
    await requireUser(request);
    if (!vapidReady()) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    webpush.setVapidDetails(
      "mailto:hello@sellersgram.app",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
      process.env.VAPID_PRIVATE_KEY as string,
    );

    const body = (await request.json()) as {
      title?: string;
      body?: string;
      href?: string;
      subscriptions?: PushSub[];
    };

    const subscriptions = (body.subscriptions || []).filter(
      (item) => item.endpoint && item.keys?.p256dh && item.keys?.auth,
    );
    if (!subscriptions.length) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const payload = JSON.stringify({
      title: body.title || "Sellers Gram",
      body: body.body || "",
      href: body.href || "/",
      icon: "/icon-192.png",
    });

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        webpush.sendNotification(
          {
            endpoint: subscription.endpoint as string,
            keys: {
              p256dh: subscription.keys?.p256dh as string,
              auth: subscription.keys?.auth as string,
            },
          },
          payload,
        ),
      ),
    );

    return NextResponse.json({
      ok: true,
      sent: results.filter((item) => item.status === "fulfilled").length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Push failed";
    const status =
      message === "Not signed in" || message === "Invalid session" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
