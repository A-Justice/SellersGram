"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { ChatMessage, ChatThread, Listing } from "@/data/types";
import { db } from "@/lib/firebase";
import { notifyUser } from "@/lib/notifications-store";

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
    const ids = new Set(snap.docs.map((item) => item.id));
    for (const [id, thread] of [...seen]) {
      if (thread.buyerId === uid && !ids.has(id)) seen.delete(id);
    }
    for (const item of snap.docs) seen.set(item.id, threadFromDoc(item.id, item.data()));
    publish();
  });
  const unsubB = onSnapshot(asSeller, (snap) => {
    const ids = new Set(snap.docs.map((item) => item.id));
    for (const [id, thread] of [...seen]) {
      if (thread.sellerId === uid && !ids.has(id)) seen.delete(id);
    }
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
          editedAt: data.editedAt ? String(data.editedAt) : undefined,
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
  const sellerId = listing.sellerId || listing.seller.id;
  if (sellerId === user.uid) {
    throw new Error("You cannot chat with yourself.");
  }
  const threadRef = doc(collection(db, "threads"));
  const now = new Date().toISOString();
  await setDoc(threadRef, {
    listingId: listing.id,
    listingTitle: listing.title,
    listingPhoto: listing.photoUrls[0] || "",
    buyerId: user.uid,
    sellerId,
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
  await notifyUser({
    userId: sellerId,
    fromUid: user.uid,
    title: `${user.name} messaged you`,
    body: text,
    href: `/inbox?thread=${threadRef.id}`,
    threadId: threadRef.id,
    type: "message",
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
  const otherId = user.uid === thread.sellerId ? thread.buyerId : thread.sellerId;
  const senderName = user.uid === thread.sellerId ? thread.sellerName : thread.buyerName;
  await notifyUser({
    userId: otherId,
    fromUid: user.uid,
    title: `${senderName} · ${thread.listingTitle}`,
    body: text,
    href: `/inbox?thread=${thread.id}`,
    threadId: thread.id,
    type: "message",
  });
}

export async function editMessage(
  thread: ChatThread,
  message: ChatMessage,
  text: string,
  messages: ChatMessage[],
) {
  if (!db) throw new Error("Firebase is not connected.");
  const trimmed = text.trim();
  if (!trimmed) return;
  await updateDoc(doc(db, "threads", thread.id, "messages", message.id), {
    text: trimmed,
    editedAt: new Date().toISOString(),
  });
  const last = messages[messages.length - 1];
  if (last?.id === message.id) {
    await updateDoc(doc(db, "threads", thread.id), { lastMessage: trimmed });
  }
}

export async function deleteMessage(thread: ChatThread, message: ChatMessage, remaining: ChatMessage[]) {
  if (!db) throw new Error("Firebase is not connected.");
  await deleteDoc(doc(db, "threads", thread.id, "messages", message.id));
  const leftover = remaining.filter((item) => item.id !== message.id);
  const last = leftover[leftover.length - 1];
  await updateDoc(doc(db, "threads", thread.id), {
    lastMessage: last?.text || "",
    updatedAt: last?.createdAt || new Date().toISOString(),
  });
}

export async function clearThread(thread: ChatThread) {
  if (!db) throw new Error("Firebase is not connected.");
  const messages = await getDocs(collection(db, "threads", thread.id, "messages"));
  const refs = [...messages.docs.map((item) => item.ref), doc(db, "threads", thread.id)];
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(i, i + 450)) batch.delete(ref);
    await batch.commit();
  }
}
