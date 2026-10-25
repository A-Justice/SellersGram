import { NextResponse } from "next/server";
import { fulfillBoostFromReference } from "@/lib/server/fulfill-boost";
import { adminReady } from "@/lib/server/firebase-admin";
import { isPaystackConfigured } from "@/lib/server/paystack";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json({ error: "Paystack is not configured." }, { status: 501 });
    }
    if (!adminReady()) {
      return NextResponse.json({ error: "Server storage is not configured." }, { status: 501 });
    }

    const user = await requireUser(request);
    const body = (await request.json()) as { reference?: string };
    const reference = String(body.reference || "").trim();
    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });
    }

    const result = await fulfillBoostFromReference(reference, {
      expectedSellerId: user.uid,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      alreadyApplied: result.alreadyApplied,
      boostedUntil: result.boostedUntil,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment verification failed.";
    const status = message === "Not signed in" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
