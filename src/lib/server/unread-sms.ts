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

type TimedItem = { createdAtMs: number };

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

function isApprovalNotification(data: Record<string, unknown>) {
  if (data.type !== "listing") return false;
  const title = String(data.title || "").toLowerCase();
  // Matches setListingStatus → "Your ad is live"
  return title.includes("live") && !title.includes("not approved");
}

function digestSmsBody(input: {
  messages: number;
  views: number;
  approvals: number;
}) {
  const parts: string[] = [];
  if (input.approvals > 0) {
    parts.push(
      `${input.approvals} approved ad${input.approvals === 1 ? "" : "s"}`,
    );
  }
  if (input.messages > 0) {
    parts.push(
      `${input.messages} new message${input.messages === 1 ? "" : "s"}`,
    );
  }
  if (input.views > 0) {
    parts.push(`${input.views} new view${input.views === 1 ? "" : "s"}`);
  }

  const summary = parts.join(", ").replace(/, ([^,]*)$/, " and $1");

  if (input.approvals > 0 && !input.messages && !input.views) {
    return `Good news — you have ${summary} on Vendors Gram. See ${
      input.approvals === 1 ? "it" : "them"
    }: ${appUrl("/my-ads")}`;
  }
  if (input.messages > 0 && !input.views && !input.approvals) {
    return `You have ${summary} on Vendors Gram. Open your inbox: ${appUrl("/inbox")}`;
  }
  if (input.views > 0 && !input.messages && !input.approvals) {
    return `Your ads got ${summary} on Vendors Gram. See them: ${appUrl("/my-ads")}`;
  }
  return `You missed ${summary} on Vendors Gram. Inbox: ${appUrl("/inbox")} Ads: ${appUrl("/my-ads")}`;
}

function countUnsent(items: TimedItem[], lastSmsMs: number | null) {
  return items.filter(
    (item) => lastSmsMs == null || item.createdAtMs > lastSmsMs,
  ).length;
}

/**
 * Daily 08:00 Africa/Accra digest: unread messages, pending listing views,
 * and approved ads the seller has not checked yet.
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

  const messagesByUser = new Map<string, TimedItem[]>();
  const approvalsByUser = new Map<string, TimedItem[]>();

  for (const item of notifSnap.docs) {
    const data = item.data() as Record<string, unknown>;
    const userId = String(data.userId || "");
    const createdAtMs = toMillis(data.createdAt);
    if (!userId || createdAtMs == null || createdAtMs >= dayStart) continue;

    if (data.type === "message") {
      const list = messagesByUser.get(userId) || [];
      list.push({ createdAtMs });
      messagesByUser.set(userId, list);
      continue;
    }

    if (isApprovalNotification(data)) {
      const list = approvalsByUser.get(userId) || [];
      list.push({ createdAtMs });
      approvalsByUser.set(userId, list);
    }
  }

  const viewsSnap = await db.collection("users").where("pendingViews", ">", 0).get();
  const candidateIds = new Set<string>([
    ...messagesByUser.keys(),
    ...approvalsByUser.keys(),
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
    const approvalItems = approvalsByUser.get(userId) || [];
    const newestUnreadMs = messageItems.length
      ? Math.max(...messageItems.map((item) => item.createdAtMs))
      : null;

    let messageCount = 0;
    if (messageItems.length) {
      if (lastInboxMs != null && newestUnreadMs != null && lastInboxMs >= newestUnreadMs) {
        // Inbox already opened after these messages.
      } else {
        messageCount = countUnsent(messageItems, lastSmsMs);
      }
    }

    // Approvals: clear if seller already checked My ads after the newest approval.
    const newestApprovalMs = approvalItems.length
      ? Math.max(...approvalItems.map((item) => item.createdAtMs))
      : null;
    let approvalCount = 0;
    if (approvalItems.length) {
      if (
        lastDigestSeenMs != null &&
        newestApprovalMs != null &&
        lastDigestSeenMs >= newestApprovalMs
      ) {
        // Seller already opened My ads / own listing after approval.
      } else {
        approvalCount = countUnsent(approvalItems, lastSmsMs);
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

    if (!messageCount && !viewCount && !approvalCount) {
      if (messageItems.length || pendingViews > 0 || approvalItems.length) {
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
      digestSmsBody({
        messages: messageCount,
        views: viewCount,
        approvals: approvalCount,
      }),
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
