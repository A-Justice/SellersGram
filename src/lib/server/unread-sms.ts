import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { publicEnv } from "@/lib/env";
import { adminDb } from "@/lib/server/firebase-admin";
import { sendSms, smsReady } from "@/lib/server/sms";

export type UnreadSmsSummary = {
  scanned: number;
  candidates: number;
  sent: number;
  skippedNoPhone: number;
  skippedOpened: number;
  skippedAlreadySent: number;
  skippedConfig: number;
  failures: number;
  errors: string[];
};

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function toMillis(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "string" || typeof value === "number") {
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

function inboxUrl() {
  return `${publicEnv.appUrl.replace(/\/$/, "")}/inbox`;
}

function unreadSmsBody(count: number) {
  const noun = count === 1 ? "message" : "messages";
  return `You have ${count} new ${noun} on Vendors Gram. Open your inbox: ${inboxUrl()}`;
}

/**
 * Text sellers who still have unread inbox messages from a previous day,
 * have not opened inbox since those messages, and have not already been
 * SMS-reminded for them. Intended to run daily at 08:00 Africa/Accra.
 */
export async function sendUnreadInboxSmsReminders(
  now = new Date(),
): Promise<UnreadSmsSummary> {
  const summary: UnreadSmsSummary = {
    scanned: 0,
    candidates: 0,
    sent: 0,
    skippedNoPhone: 0,
    skippedOpened: 0,
    skippedAlreadySent: 0,
    skippedConfig: 0,
    failures: 0,
    errors: [],
  };

  if (!smsReady()) {
    summary.skippedConfig = 1;
    summary.errors.push("MNOTIFY_API_KEY is not set.");
    return summary;
  }

  const db = adminDb();
  const dayStart = startOfUtcDay(now).getTime();

  // Single-field query (no composite index required). Filter type in memory.
  const snap = await db.collection("notifications").where("read", "==", false).get();

  summary.scanned = snap.size;

  const byUser = new Map<string, { createdAtMs: number }[]>();
  for (const item of snap.docs) {
    const data = item.data();
    if (data.type !== "message") continue;
    const userId = String(data.userId || "");
    const createdAtMs = toMillis(data.createdAt);
    if (!userId || createdAtMs == null) continue;
    // Only messages from before today → remind the following morning.
    if (createdAtMs >= dayStart) continue;
    const list = byUser.get(userId) || [];
    list.push({ createdAtMs });
    byUser.set(userId, list);
  }

  summary.candidates = byUser.size;

  for (const [userId, items] of byUser) {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      summary.skippedNoPhone += 1;
      continue;
    }

    const user = userSnap.data() || {};
    const phone = String(user.phone || "").trim();
    if (!phone) {
      summary.skippedNoPhone += 1;
      continue;
    }

    const newestUnreadMs = Math.max(...items.map((item) => item.createdAtMs));
    const lastInboxMs = toMillis(user.lastInboxOpenedAt);
    if (lastInboxMs != null && lastInboxMs >= newestUnreadMs) {
      summary.skippedOpened += 1;
      continue;
    }

    const lastSmsMs = toMillis(user.lastUnreadSmsAt);
    const pending = items.filter(
      (item) => lastSmsMs == null || item.createdAtMs > lastSmsMs,
    );
    if (!pending.length) {
      summary.skippedAlreadySent += 1;
      continue;
    }

    const result = await sendSms(phone, unreadSmsBody(pending.length));
    if (!result.ok) {
      summary.failures += 1;
      summary.errors.push(`${userId}: ${result.error || "send failed"}`);
      continue;
    }
    if (result.skipped) {
      summary.skippedConfig += 1;
      continue;
    }

    await userRef.set(
      { lastUnreadSmsAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    summary.sent += 1;
  }

  return summary;
}
