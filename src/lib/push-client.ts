"use client";

import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { publicEnv } from "@/lib/env";
import { db } from "@/lib/firebase";

export type PushSub = {
  endpoint: string;
  expirationTime: number | null;
  keys: { p256dh: string; auth: string };
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(publicEnv.vapidPublicKey)
  );
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
}

export async function enableDevicePush(uid: string) {
  if (!db || !pushSupported()) {
    throw new Error("Device alerts are not available here.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Allow notifications in your browser to get device alerts.");
  }
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicEnv.vapidPublicKey),
    }));
  const payload = subscription.toJSON() as PushSub;
  await updateDoc(doc(db, "users", uid), {
    pushSubscriptions: arrayUnion(payload),
  });
  return payload;
}

export async function disableDevicePush(uid: string) {
  if (!db || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  const payload = subscription.toJSON() as PushSub;
  await subscription.unsubscribe();
  await updateDoc(doc(db, "users", uid), {
    pushSubscriptions: arrayRemove(payload),
  });
}

export async function currentPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}
