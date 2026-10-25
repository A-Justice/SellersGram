import { NextResponse } from "next/server";
import { fulfillBoostFromReference } from "@/lib/server/fulfill-boost";
import { adminReady } from "@/lib/server/firebase-admin";
import {
  isPaystackConfigured,
  verifyPaystackWebhookSignature,
} from "@/lib/server/paystack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaystackWebhookBody = {
  event?: string;
  data?: {
    reference?: string;
    status?: string;
    metadata?: Record<string, string | number>;
  };
};

/**
 * Paystack server-to-server webhook.
 * Set Live Webhook URL to: https://vendorsgram.com/api/paystack/webhook
 */
export async function POST(request: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Paystack is not configured." }, { status: 501 });
  }
  if (!adminReady()) {
    return NextResponse.json({ error: "Server storage is not configured." }, { status: 501 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: PaystackWebhookBody;
  try {
    event = JSON.parse(rawBody) as PaystackWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Acknowledge quickly for events we don't handle.
  if (event.event !== "charge.success") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const reference = String(event.data?.reference || "").trim();
  if (!reference) {
    return NextResponse.json({ error: "Missing reference." }, { status: 400 });
  }

  // Only fulfill boost references we created (vg-boost-...).
  if (!reference.startsWith("vg-boost-")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const result = await fulfillBoostFromReference(reference);
    if (!result.ok) {
      // Still 200 for known business failures so Paystack does not hammer retries
      // for payments that can never fulfill (bad metadata). Log-worthy cases return 500.
      const retryable = result.status >= 500;
      return NextResponse.json(
        { error: result.error },
        { status: retryable ? 500 : 200 },
      );
    }
    return NextResponse.json({
      ok: true,
      alreadyApplied: result.alreadyApplied,
      boostedUntil: result.boostedUntil,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed.";
    console.error("Paystack webhook error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
