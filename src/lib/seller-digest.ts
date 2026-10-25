"use client";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Clear pending view digest when the seller checks their ads / own listing. */
export async function markSellerDigestSeen(uid: string) {
  if (!db || !uid) return;
  await setDoc(
    doc(db, "users", uid),
    {
      pendingViews: 0,
      pendingCallInterests: 0,
      lastSellerDigestSeenAt: serverTimestamp(),
    },
    { merge: true },
  );
}
