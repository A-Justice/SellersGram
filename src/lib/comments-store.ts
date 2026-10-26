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
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import type { ListingComment } from "@/data/types";
import { db } from "@/lib/firebase";
import { notifyUser } from "@/lib/notifications-store";

const MAX_COMMENT_LENGTH = 2000;

function toComment(id: string, data: Record<string, unknown>): ListingComment {
  return {
    id,
    listingId: String(data.listingId || ""),
    sellerId: String(data.sellerId || ""),
    parentId: data.parentId ? String(data.parentId) : null,
    authorId: String(data.authorId || ""),
    authorName: String(data.authorName || "Someone"),
    text: String(data.text || ""),
    createdAt: String(data.createdAt || new Date().toISOString()),
  };
}

export function subscribeListingComments(
  listingId: string,
  onChange: (comments: ListingComment[]) => void,
): Unsubscribe {
  if (!db || !listingId) {
    onChange([]);
    return () => undefined;
  }

  const ref = query(
    collection(db, "comments"),
    where("listingId", "==", listingId),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(
    ref,
    (snap) => {
      onChange(snap.docs.map((item) => toComment(item.id, item.data())));
    },
    () => onChange([]),
  );
}

export function groupComments(comments: ListingComment[]) {
  const roots = comments.filter((item) => !item.parentId);
  const repliesByParent = new Map<string, ListingComment[]>();
  for (const item of comments) {
    if (!item.parentId) continue;
    const list = repliesByParent.get(item.parentId) || [];
    list.push(item);
    repliesByParent.set(item.parentId, list);
  }
  const sortedRoots = [...roots].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return { roots: sortedRoots, repliesByParent };
}

export async function addListingComment(input: {
  listingId: string;
  listingTitle: string;
  sellerId: string;
  parentId?: string | null;
  replyToAuthorId?: string | null;
  authorId: string;
  authorName: string;
  text: string;
}) {
  if (!db) throw new Error("Firebase is not connected.");
  const text = input.text.trim();
  if (!text) throw new Error("Write a comment first.");
  if (text.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comments can be at most ${MAX_COMMENT_LENGTH} characters.`);
  }

  const now = new Date().toISOString();
  const parentId = input.parentId || null;
  await addDoc(collection(db, "comments"), {
    listingId: input.listingId,
    sellerId: input.sellerId,
    parentId,
    authorId: input.authorId,
    authorName: input.authorName,
    text,
    createdAt: now,
  });

  const href = `/listing/${input.listingId}#comments`;
  const preview = text.length > 120 ? `${text.slice(0, 117)}…` : text;

  if (parentId && input.replyToAuthorId) {
    await notifyUser({
      userId: input.replyToAuthorId,
      fromUid: input.authorId,
      title: `${input.authorName} replied to your comment`,
      body: preview,
      href,
      type: "listing",
    });
  }

  // Avoid a second notification when the seller is already the reply target.
  if (!parentId || input.sellerId !== input.replyToAuthorId) {
    await notifyUser({
      userId: input.sellerId,
      fromUid: input.authorId,
      title: parentId
        ? `${input.authorName} replied on your ad`
        : `${input.authorName} commented on your ad`,
      body: `${input.listingTitle}: ${preview}`,
      href,
      type: "listing",
    });
  }
}

export async function deleteListingComment(
  comment: ListingComment,
  actorUid: string,
) {
  if (!db) throw new Error("Firebase is not connected.");
  if (comment.authorId !== actorUid) {
    throw new Error("You can only delete your own comments.");
  }

  if (!comment.parentId) {
    const replies = await getDocs(
      query(
        collection(db, "comments"),
        where("listingId", "==", comment.listingId),
        where("parentId", "==", comment.id),
      ),
    );
    const batch = writeBatch(db);
    batch.delete(doc(db, "comments", comment.id));
    for (const item of replies.docs) batch.delete(item.ref);
    await batch.commit();
    return;
  }

  await deleteDoc(doc(db, "comments", comment.id));
}
