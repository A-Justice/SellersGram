"use client";

import { useEffect, useState } from "react";
import type { Listing } from "@/data/types";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { sortListings } from "@/lib/format";
import { backfillMissingEmbeddings, subscribeListings } from "@/lib/listings-store";

export function useListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!db) {
      setListings([]);
      setReady(true);
      return;
    }
    const unsub = subscribeListings((next) => {
      setListings(next);
      setReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user?.uid || !listings.length) return;
    void backfillMissingEmbeddings(listings, user.uid);
  }, [listings, user?.uid]);

  return {
    listings,
    live: sortListings(listings.filter((item) => item.status === "live")),
    ready,
  };
}

export function bumpData() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("sg-data"));
}
