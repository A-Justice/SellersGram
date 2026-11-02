"use client";

import { Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useListings } from "@/lib/use-listings";

const STORAGE_AT = "vg-boost-promo-at";
const STORAGE_NEVER = "vg-boost-promo-never";
const INTERVAL_MS = 5 * 24 * 60 * 60 * 1000; // ~5 days
const SHOW_DELAY_MS = 9000; // After install/push prompts settle

function shouldShowBoostPromo() {
  if (typeof window === "undefined") return false;
  if (window.localStorage.getItem(STORAGE_NEVER) === "1") return false;
  const raw = window.localStorage.getItem(STORAGE_AT);
  if (!raw) return true;
  const at = Date.parse(raw);
  if (Number.isNaN(at)) return true;
  return Date.now() - at >= INTERVAL_MS;
}

function markBoostPromoSeen() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_AT, new Date().toISOString());
}

function markBoostPromoNever() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_NEVER, "1");
}

/** Occasional nudge for sellers to boost — top placement, Google, free TikTok posts. */
export function BoostPromoPrompt() {
  const { user } = useAuth();
  const { listings, ready } = useListings();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const hasOwnLiveAd = Boolean(
    user &&
      listings.some(
        (listing) =>
          listing.status === "live" &&
          (listing.sellerId === user.uid || listing.seller.id === user.uid),
      ),
  );

  useEffect(() => {
    if (!ready || !user || !hasOwnLiveAd) {
      setVisible(false);
      return;
    }
    if (
      pathname.startsWith("/boost") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/sell")
    ) {
      setVisible(false);
      return;
    }
    if (!shouldShowBoostPromo()) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || !shouldShowBoostPromo()) return;
      setVisible(true);
      markBoostPromoSeen();
    }, SHOW_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ready, user, hasOwnLiveAd, pathname]);

  if (!visible) return null;

  function close() {
    markBoostPromoSeen();
    setVisible(false);
  }

  function neverShow() {
    markBoostPromoNever();
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-0 z-[58] flex items-end justify-center bg-ink/45 p-4 sm:items-center"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="boost-promo-title"
        className="w-full max-w-md rounded-[28px] bg-paper p-5 shadow-[0_24px_60px_rgba(20,17,14,0.28)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
            <Sparkles className="size-5" />
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="rounded-full p-2 text-muted hover:bg-canvas hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <h2
          id="boost-promo-title"
          className="mt-4 font-display text-2xl tracking-tight"
        >
          Put your ad on top
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Boost so buyers see you first in Top Ads, find you more easily on
          Google, and get free TikTok posts from Vendors Gram.
        </p>

        <Link
          href="/my-ads"
          onClick={close}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-ink text-sm font-medium text-paper hover:bg-accent"
        >
          Boost an ad
        </Link>
        <button
          type="button"
          onClick={close}
          className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={neverShow}
          className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-full text-xs font-medium text-muted/80 hover:text-ink"
        >
          Don&apos;t show again
        </button>
      </div>
    </div>
  );
}
