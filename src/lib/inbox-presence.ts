"use client";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Record that the signed-in user opened the inbox (clears SMS reminder eligibility). */
export async function markInboxOpened(uid: string) {
  if (!db || !uid) return;
  await setDoc(
    doc(db, "users", uid),
    { lastInboxOpenedAt: serverTimestamp() },
    { merge: true },
  );
}
