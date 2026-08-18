"use client";

import { useEffect, useState } from "react";
import type { Listing } from "@/data/types";
import { db } from "@/lib/firebase";
import { sortListings } from "@/lib/format";
import { subscribeListings } from "@/lib/listings-store";

export function useListings() {
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
