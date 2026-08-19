"use client";

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserInterest } from "@/data/types";

export type TrackType = "view" | "call_reveal";

function interestRef(uid: string, listingId: string) {
  if (!db) throw new Error("Firebase is not connected.");
  return doc(db, "users", uid, "interests", listingId);
}

export async function recordUserInterest(input: {
  listingId: string;
  sellerId: string;
  categoryId: string;
  regionId: string;
  type: TrackType;
}) {
  const uid = auth?.currentUser?.uid;
  if (!uid || !db) return;

  const now = new Date().toISOString();
  const patch: UserInterest = {
    listingId: input.listingId,
    sellerId: input.sellerId,
    categoryId: input.categoryId,
    regionId: input.regionId,
    lastSeenAt: now,
  };

  if (input.type === "view") patch.viewedAt = now;
  if (input.type === "call_reveal") {
    patch.callRevealedAt = now;
    patch.callInterest = true;
  }

  await setDoc(interestRef(uid, input.listingId), patch, { merge: true });
}

export async function trackListingEngagement(input: {
  listingId: string;
  sellerId: string;
  categoryId: string;
  regionId: string;
  type: TrackType;
}) {
  const token = await auth?.currentUser?.getIdToken().catch(() => null);

  void fetch("/api/listings/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      listingId: input.listingId,
      sellerId: input.sellerId,
      type: input.type,
    }),
  }).catch(() => undefined);

  if (token) {
    void recordUserInterest(input).catch(() => undefined);
  }
}

export function subscribeUserInterests(
  uid: string,
  onChange: (items: UserInterest[]) => void,
): Unsubscribe {
  if (!db) {
    onChange([]);
    return () => undefined;
  }

  return onSnapshot(collection(db, "users", uid, "interests"), (snap) => {
    onChange(
      snap.docs.map((item) => item.data() as UserInterest).filter((row) => row.listingId),
    );
  });
}
