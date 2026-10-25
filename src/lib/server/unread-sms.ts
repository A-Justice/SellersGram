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

function appUrl(path: string) {
  return `${publicEnv.appUrl.replace(/\/$/, "")}${path}`;
}

function digestSmsBody(input: { messages: number; views: number }) {
  const parts: string[] = [];
  if (input.messages > 0) {
    parts.push(
      `${input.messages} new message${input.messages === 1 ? "" : "s"}`,
    );
  }
  if (input.views > 0) {
    parts.push(`${input.views} new view${input.views === 1 ? "" : "s"}`);
  }
  const summary = parts.join(" and ");
  if (input.messages > 0 && input.views > 0) {
    return `You missed ${summary} on Vendors Gram. Inbox: ${appUrl("/inbox")} Ads: ${appUrl("/my-ads")}`;
  }
  if (input.messages > 0) {
    return `You have ${summary} on Vendors Gram. Open your inbox: ${appUrl("/inbox")}`;
  }
  return `Your ads got ${summary} on Vendors Gram. See them: ${appUrl("/my-ads")}`;
}

/**
 * Daily 08:00 Africa/Accra digest: unread inbox messages and/or pending
 * listing views the seller has not checked yet.
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

  const notifSnap = await db.collection("notifications").where("read", "==", false).get();
  summary.scanned = notifSnap.size;

  const messagesByUser = new Map<string, { createdAtMs: number }[]>();
  for (const item of notifSnap.docs) {
    const data = item.data();
    if (data.type !== "message") continue;
    const userId = String(data.userId || "");
    const createdAtMs = toMillis(data.createdAt);
    if (!userId || createdAtMs == null || createdAtMs >= dayStart) continue;
    const list = messagesByUser.get(userId) || [];
    list.push({ createdAtMs });
    messagesByUser.set(userId, list);
  }

  const viewsSnap = await db.collection("users").where("pendingViews", ">", 0).get();
  const candidateIds = new Set<string>([
    ...messagesByUser.keys(),
    ...viewsSnap.docs.map((item) => item.id),
  ]);
  summary.candidates = candidateIds.size;

  for (const userId of candidateIds) {
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

    const lastSmsMs = toMillis(user.lastUnreadSmsAt);
    const lastInboxMs = toMillis(user.lastInboxOpenedAt);
    const lastDigestSeenMs = toMillis(user.lastSellerDigestSeenAt);

    const messageItems = messagesByUser.get(userId) || [];
    const newestUnreadMs = messageItems.length
      ? Math.max(...messageItems.map((item) => item.createdAtMs))
      : null;

    let messageCount = 0;
    if (messageItems.length) {
      if (lastInboxMs != null && newestUnreadMs != null && lastInboxMs >= newestUnreadMs) {
        // Inbox already opened after these messages.
      } else {
        messageCount = messageItems.filter(
          (item) => lastSmsMs == null || item.createdAtMs > lastSmsMs,
        ).length;
      }
    }

    const pendingViews = Number(user.pendingViews || 0);
    const pendingUpdatedMs = toMillis(user.pendingEngagementUpdatedAt);
    let viewCount = 0;
    if (
      pendingViews > 0 &&
      pendingUpdatedMs != null &&
      pendingUpdatedMs < dayStart &&
      (lastDigestSeenMs == null || lastDigestSeenMs < pendingUpdatedMs) &&
      (lastSmsMs == null || lastSmsMs < pendingUpdatedMs)
    ) {
      viewCount = pendingViews;
    }

    if (!messageCount && !viewCount) {
      if (messageItems.length || pendingViews > 0) {
        if (lastInboxMs != null || lastDigestSeenMs != null) {
          summary.skippedOpened += 1;
        } else {
          summary.skippedAlreadySent += 1;
        }
      }
      continue;
    }

    const result = await sendSms(
      phone,
      digestSmsBody({ messages: messageCount, views: viewCount }),
    );
    if (!result.ok) {
      summary.failures += 1;
      summary.errors.push(`${userId}: ${result.error || "send failed"}`);
      continue;
    }
    if (result.skipped) {
      summary.skippedConfig += 1;
      continue;
    }

    const patch: Record<string, unknown> = {
      lastUnreadSmsAt: FieldValue.serverTimestamp(),
    };
    if (viewCount > 0) {
      patch.pendingViews = 0;
      patch.pendingCallInterests = 0;
    }
    await userRef.set(patch, { merge: true });
    summary.sent += 1;
  }

  return summary;
}
