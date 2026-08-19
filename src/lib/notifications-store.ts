"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppNotification } from "@/data/types";

function toNotification(id: string, data: Record<string, unknown>): AppNotification {
  return {
    id,
    userId: String(data.userId || ""),
    title: String(data.title || ""),
    body: String(data.body || ""),
    href: String(data.href || "/"),
    type: data.type === "listing" || data.type === "system" ? data.type : "message",
    threadId: data.threadId ? String(data.threadId) : undefined,
    read: Boolean(data.read),
    createdAt: String(data.createdAt || new Date().toISOString()),
  };
}

export function subscribeNotifications(
  uid: string,
  onChange: (items: AppNotification[]) => void,
) {
  if (!db) return () => undefined;
  const ref = query(collection(db, "notifications"), where("userId", "==", uid));
  return onSnapshot(ref, (snap) => {
    const items = snap.docs
      .map((item) => toNotification(item.id, item.data()))
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    onChange(items);
  });
}

export async function markNotificationRead(id: string) {
  if (!db) return;
  await updateDoc(doc(db, "notifications", id), { read: true });
}

export async function markAllNotificationsRead(items: AppNotification[]) {
  await Promise.all(items.filter((item) => !item.read).map((item) => markNotificationRead(item.id)));
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function purgeOldReadNotifications(items: AppNotification[]) {
  if (!db) return 0;
  const cutoff = Date.now() - ONE_WEEK_MS;
  const stale = items.filter(
    (item) => item.read && new Date(item.createdAt).getTime() < cutoff,
  );
  await Promise.all(
    stale.map((item) => deleteDoc(doc(db!, "notifications", item.id))),
  );
  return stale.length;
}

export async function notifyUser(input: {
  userId: string;
  title: string;
  body: string;
  href: string;
  type?: AppNotification["type"];
  threadId?: string;
  fromUid?: string;
}) {
  if (!db || !input.userId) return;
  if (input.userId === input.fromUid || input.userId === auth?.currentUser?.uid) {
    return;
  }

  try {
    await addDoc(collection(db, "notifications"), {
      userId: input.userId,
      title: input.title,
      body: input.body,
      href: input.href,
      type: input.type || "system",
      threadId: input.threadId || null,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Could not save notification", error);
    return;
  }

  const userSnap = await getDoc(doc(db, "users", input.userId));
  const subscriptions = userSnap.data()?.pushSubscriptions;
  if (!Array.isArray(subscriptions) || !subscriptions.length) return;

  const token = await auth?.currentUser?.getIdToken();
  if (!token) return;

  await fetch("/api/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.title,
      body: input.body,
      href: input.href,
      subscriptions,
    }),
  }).catch(() => undefined);
}
