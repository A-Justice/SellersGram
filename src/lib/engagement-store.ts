"use client";

import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { ListingViewer, UserInterest } from "@/data/types";

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

function viewerFromDoc(
  id: string,
  data: Record<string, unknown>,
): ListingViewer {
  const last = data.lastViewedAt as { toDate?: () => Date } | string | undefined;
  let lastViewedAt = new Date().toISOString();
  if (typeof last === "string") lastViewedAt = last;
  else if (last && typeof last.toDate === "function") {
    lastViewedAt = last.toDate().toISOString();
  }

  return {
    viewerUid: String(data.viewerUid || id),
    viewerName: String(data.viewerName || "Someone"),
    lastViewedAt,
    viewCount: typeof data.viewCount === "number" ? data.viewCount : 1,
  };
}

/** Seller-only: people who opened this listing while signed in. */
export function subscribeListingViewers(
  sellerId: string,
  listingId: string,
  onChange: (viewers: ListingViewer[]) => void,
): Unsubscribe {
  if (!db || !sellerId || !listingId) {
    onChange([]);
    return () => undefined;
  }

  const nested = query(
    collection(db, "listings", sellerId, "ads", listingId, "viewers"),
    orderBy("lastViewedAt", "desc"),
    limit(40),
  );
  const flat = query(
    collection(db, "listings", listingId, "viewers"),
    orderBy("lastViewedAt", "desc"),
    limit(40),
  );

  let nestedItems: ListingViewer[] = [];
  let flatItems: ListingViewer[] = [];
  const publish = () => {
    const map = new Map<string, ListingViewer>();
    for (const item of [...nestedItems, ...flatItems]) {
      const prev = map.get(item.viewerUid);
      if (!prev || new Date(item.lastViewedAt) > new Date(prev.lastViewedAt)) {
        map.set(item.viewerUid, item);
      }
    }
    onChange(
      [...map.values()].sort(
        (a, b) =>
          new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime(),
      ),
    );
  };

  const unsubNested = onSnapshot(
    nested,
    (snap) => {
      nestedItems = snap.docs.map((item) => viewerFromDoc(item.id, item.data()));
      publish();
    },
    () => {
      nestedItems = [];
      publish();
    },
  );
  const unsubFlat = onSnapshot(
    flat,
    (snap) => {
      flatItems = snap.docs.map((item) => viewerFromDoc(item.id, item.data()));
      publish();
    },
    () => {
      flatItems = [];
      publish();
    },
  );

  return () => {
    unsubNested();
    unsubFlat();
  };
}
