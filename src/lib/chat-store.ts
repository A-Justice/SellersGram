"use client";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { ChatMessage, ChatThread, Listing } from "@/data/types";
import { db } from "@/lib/firebase";

function threadFromDoc(id: string, data: Record<string, unknown>): ChatThread {
  return {
    id,
    listingId: String(data.listingId || ""),
    listingTitle: String(data.listingTitle || ""),
    listingPhoto: String(data.listingPhoto || ""),
    buyerId: String(data.buyerId || ""),
    sellerId: String(data.sellerId || ""),
    buyerName: String(data.buyerName || ""),
    sellerName: String(data.sellerName || ""),
    lastMessage: String(data.lastMessage || ""),
    updatedAt: String(data.updatedAt || new Date().toISOString()),
  };
}

export function subscribeThreads(
  uid: string,
  onChange: (threads: ChatThread[]) => void,
) {
  if (!db) return () => undefined;
  const ref = collection(db, "threads");
  const asBuyer = query(ref, where("buyerId", "==", uid));
  const asSeller = query(ref, where("sellerId", "==", uid));
  const seen = new Map<string, ChatThread>();

  const publish = () => {
    onChange(
      [...seen.values()].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    );
  };

  const unsubA = onSnapshot(asBuyer, (snap) => {
    for (const item of snap.docs) seen.set(item.id, threadFromDoc(item.id, item.data()));
    publish();
  });
  const unsubB = onSnapshot(asSeller, (snap) => {
    for (const item of snap.docs) seen.set(item.id, threadFromDoc(item.id, item.data()));
    publish();
  });

  return () => {
    unsubA();
    unsubB();
  };
}

export function subscribeMessages(
  threadId: string,
  onChange: (messages: ChatMessage[]) => void,
) {
  if (!db) return () => undefined;
  const ref = query(
    collection(db, "threads", threadId, "messages"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(ref, (snap) => {
    onChange(
      snap.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          threadId,
          fromUid: String(data.fromUid || ""),
          from: data.from === "seller" ? "seller" : "buyer",
          text: String(data.text || ""),
          createdAt: String(data.createdAt || new Date().toISOString()),
        };
      }),
    );
  });
}

export async function startThread(
  listing: Listing,
  user: { uid: string; name: string },
  text: string,
) {
  if (!db) throw new Error("Firebase is not connected.");
  const threadRef = doc(collection(db, "threads"));
  const now = new Date().toISOString();
  await setDoc(threadRef, {
    listingId: listing.id,
    listingTitle: listing.title,
    listingPhoto: listing.photoUrls[0] || "",
    buyerId: user.uid,
    sellerId: listing.sellerId || listing.seller.id,
    buyerName: user.name,
    sellerName: listing.seller.name,
    lastMessage: text,
    updatedAt: now,
  });
  await addDoc(collection(db, "threads", threadRef.id, "messages"), {
    fromUid: user.uid,
    from: "buyer",
    text,
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });
  return threadRef.id;
}

export async function sendMessage(
  thread: ChatThread,
  user: { uid: string },
  text: string,
) {
  if (!db) throw new Error("Firebase is not connected.");
  const now = new Date().toISOString();
  const from: "buyer" | "seller" = user.uid === thread.sellerId ? "seller" : "buyer";
  await addDoc(collection(db, "threads", thread.id, "messages"), {
    fromUid: user.uid,
    from,
    text,
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });
  await updateDoc(doc(db, "threads", thread.id), {
    lastMessage: text,
    updatedAt: now,
  });
}
