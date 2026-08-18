"use client";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";
import type { Report } from "@/data/types";
import { db } from "@/lib/firebase";

export function subscribeReports(onChange: (reports: Report[]) => void) {
  if (!db) return () => undefined;
  const ref = query(collection(db, "reports"), orderBy("createdAt", "desc"));
  return onSnapshot(ref, (snap) => {
    onChange(
      snap.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          listingId: String(data.listingId || ""),
          listingTitle: String(data.listingTitle || ""),
          reason: String(data.reason || ""),
          status: data.status === "resolved" ? "resolved" : "open",
          createdAt: String(data.createdAt || new Date().toISOString()),
        };
      }),
    );
  });
}

export async function createReport(input: {
  listingId: string;
  listingTitle: string;
  reason: string;
}) {
  if (!db) throw new Error("Firebase is not connected.");
  await addDoc(collection(db, "reports"), {
    ...input,
    status: "open",
    createdAt: new Date().toISOString(),
  });
}

export async function resolveReport(id: string) {
  if (!db) throw new Error("Firebase is not connected.");
  await updateDoc(doc(db, "reports", id), { status: "resolved" });
}
