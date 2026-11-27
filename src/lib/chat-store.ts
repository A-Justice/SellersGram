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
import type {
  ChatMessage,
  ChatProductReference,
  ChatThread,
  Listing,
} from "@/data/types";
import { db } from "@/lib/firebase";
import { notifyUser } from "@/lib/notifications-store";
import {
  ADMIN_DISPLAY_NAME,
  ADMIN_SYSTEM_UID,
  adminModerationThreadId,
  isAdminSystemUid,
} from "@/lib/owner";

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
    isAdminThread: Boolean(data.isAdminThread) || isAdminSystemUid(String(data.buyerId || "")),
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
        const refData = data.reference as Record<string, unknown> | undefined;
        const imageUrl =
          refData && typeof refData.imageUrl === "string"
            ? String(refData.imageUrl)
            : "";
        const reference: ChatProductReference | undefined = imageUrl
          ? {
              listingId: String(refData?.listingId || ""),
              listingTitle: String(
                refData?.listingTitle ||
                  (refData?.custom ? "Your photo" : "Listing"),
              ),
              imageUrl,
              imageIndex:
                typeof refData?.imageIndex === "number"
                  ? refData.imageIndex
                  : 0,
              custom: Boolean(refData?.custom),
            }
          : undefined;
        return {
          id: item.id,
          threadId,
          fromUid: String(data.fromUid || ""),
          from: data.from === "seller" ? "seller" : "buyer",
          text: String(data.text || ""),
          createdAt: String(data.createdAt || new Date().toISOString()),
          editedAt: data.editedAt ? String(data.editedAt) : undefined,
          reference,
        };
      }),
    );
  });
}

function lastMessagePreview(text: string, reference?: ChatProductReference) {
  const trimmed = text.trim();
  if (trimmed) return trimmed;
  if (reference?.custom) return "Shared a photo";
  if (reference) return `Photo · ${reference.listingTitle}`;
  return "";
}

export function inboxDraftStorageKey(threadId: string) {
  return `vg-inbox-draft:${threadId}`;
}

/** Existing buyer↔listing thread, if any (most recently updated). */
export async function findBuyerListingThread(
  buyerId: string,
  listingId: string,
): Promise<ChatThread | null> {
  if (!db) return null;
  const snap = await getDocs(
    query(collection(db, "threads"), where("buyerId", "==", buyerId)),
  );
  const matches = snap.docs
    .filter((item) => String(item.data().listingId || "") === listingId)
    .map((item) => threadFromDoc(item.id, item.data()))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  return matches[0] || null;
}

/**
 * Open or create a thread for this listing — no first message, no notify.
 * Caller prefills the inbox composer when the thread is new/empty.
 */
export async function ensureBuyerListingThread(
  listing: Listing,
  user: { uid: string; name: string },
): Promise<ChatThread> {
  if (!db) throw new Error("Firebase is not connected.");
  const sellerId = listing.sellerId || listing.seller.id;
  if (sellerId === user.uid) {
    throw new Error("You cannot chat with yourself.");
  }

  const existing = await findBuyerListingThread(user.uid, listing.id);
  if (existing) return existing;

  const threadRef = doc(collection(db, "threads"));
  const now = new Date().toISOString();
  const data = {
    listingId: listing.id,
    listingTitle: listing.title,
    listingPhoto: listing.photoUrls[0] || "",
    buyerId: user.uid,
    sellerId,
    buyerName: user.name,
    sellerName: listing.seller.name,
    lastMessage: "",
    updatedAt: now,
  };
  await setDoc(threadRef, data);
  return threadFromDoc(threadRef.id, data);
}

export async function sendMessage(
  thread: ChatThread,
  user: { uid: string },
  text: string,
  reference?: ChatProductReference,
) {
  if (!db) throw new Error("Firebase is not connected.");
  if (thread.isAdminThread || isAdminSystemUid(thread.buyerId)) {
    throw new Error("You can’t reply to Admin notices.");
  }
  const trimmed = text.trim();
  if (!trimmed && !reference) return;
  const now = new Date().toISOString();
  const from: "buyer" | "seller" = user.uid === thread.sellerId ? "seller" : "buyer";
  const preview = lastMessagePreview(trimmed, reference);
  await addDoc(collection(db, "threads", thread.id, "messages"), {
    fromUid: user.uid,
    from,
    text: trimmed,
    ...(reference
      ? {
          reference: {
            listingId: reference.listingId,
            listingTitle: reference.listingTitle,
            imageUrl: reference.imageUrl,
            imageIndex: reference.imageIndex,
            custom: Boolean(reference.custom),
          },
        }
      : {}),
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });
  await updateDoc(doc(db, "threads", thread.id), {
    lastMessage: preview,
    updatedAt: now,
  });
  const otherId = user.uid === thread.sellerId ? thread.buyerId : thread.sellerId;
  const senderName = user.uid === thread.sellerId ? thread.sellerName : thread.buyerName;
  await notifyUser({
    userId: otherId,
    fromUid: user.uid,
    title: `${senderName} · ${thread.listingTitle}`,
    body: preview,
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
    lastMessage: last
      ? lastMessagePreview(last.text, last.reference)
      : "",
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

/** Inbox notice from system Admin → seller about a rejected/hidden ad. */
export async function sendAdminListingNotice(input: {
  listing: Listing;
  action: "rejected" | "hidden";
  reason: string;
}) {
  if (!db) throw new Error("Firebase is not connected.");
  const reason = input.reason.trim();
  if (!reason) throw new Error("Add a reason for the seller.");

  const listing = input.listing;
  const sellerId = listing.sellerId || listing.seller.id;
  if (!sellerId) throw new Error("Seller missing on this ad.");

  const threadId = adminModerationThreadId(listing.id);
  const now = new Date().toISOString();
  const actionLabel = input.action === "rejected" ? "not approved" : "hidden";
  const text = [
    `Your ad “${listing.title}” was ${actionLabel}.`,
    "",
    `Reason: ${reason}`,
  ].join("\n");

  await setDoc(
    doc(db, "threads", threadId),
    {
      listingId: listing.id,
      listingTitle: listing.title,
      listingPhoto: listing.photoUrls[0] || "",
      buyerId: ADMIN_SYSTEM_UID,
      sellerId,
      buyerName: ADMIN_DISPLAY_NAME,
      sellerName: listing.seller.name,
      lastMessage: text,
      updatedAt: now,
      isAdminThread: true,
    },
    { merge: true },
  );

  await addDoc(collection(db, "threads", threadId, "messages"), {
    fromUid: ADMIN_SYSTEM_UID,
    from: "buyer",
    text,
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });

  await notifyUser({
    userId: sellerId,
    fromUid: ADMIN_SYSTEM_UID,
    title: `Admin · ${listing.title}`,
    body: reason,
    href: `/inbox?thread=${threadId}`,
    threadId,
    type: "message",
  });

  return threadId;
}
