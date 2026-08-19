"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { BOOST_PACKAGES } from "@/data/seed";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { formatGhs, isBoosted } from "@/lib/format";
import { useListings } from "@/lib/use-listings";

export default function BoostPage() {
  const { id } = useParams<{ id: string }>();
  const { listings } = useListings();
  const listing = listings.find((item) => item.id === id);
  const { user } = useAuth();
  const router = useRouter();
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!listing) return <p className="py-16 text-center text-muted">Ad not found.</p>;

  const sellerId = listing.sellerId || listing.seller.id;
  const ownsAd = user?.uid === sellerId;

  async function pay(packId: string) {
    if (!user || !ownsAd) return;
    setError("");
    setPaying(packId);
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error("Sign in again to boost this ad.");

      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId: listing!.id,
          sellerId,
          packId,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        authorizationUrl?: string;
      };
      if (!response.ok || !data.authorizationUrl) {
        throw new Error(data.error || "Could not start payment.");
      }

      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed to start.");
      setPaying(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          Boost
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Top Ad</h1>
        <p className="mt-2 text-sm text-muted">
          Pay with Paystack. Your ad stays at the top of its category until the boost ends.
        </p>
      </div>
      <div className="rounded-[24px] bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)]">
        <p className="font-medium">{listing.title}</p>
        <p className="text-sm text-muted">
          {isBoosted(listing) ? "Already boosted — buying more extends it." : "Not boosted yet."}
        </p>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-3">
        {BOOST_PACKAGES.map((pack) => (
          <button
            key={pack.id}
            type="button"
            disabled={!user || !ownsAd || paying !== null}
            onClick={() => pay(pack.id)}
            className="flex items-center justify-between rounded-[24px] bg-paper px-5 py-4 text-left shadow-[0_0_0_1px_var(--color-line)] hover:shadow-[0_0_0_1px_var(--color-ink)] disabled:opacity-50"
          >
            <span>
              <span className="block font-display text-xl">{pack.label}</span>
              <span className="text-sm text-muted">
                {paying === pack.id ? "Opening Paystack…" : "Top of category · Paystack"}
              </span>
            </span>
            <span className="text-lg font-semibold">{formatGhs(pack.priceGhs)}</span>
          </button>
        ))}
      </div>
      {!user ? (
        <p className="text-center text-sm text-muted">
          <button type="button" className="text-accent" onClick={() => router.push("/login")}>
            Sign in
          </button>{" "}
          to boost this ad.
        </p>
      ) : !ownsAd ? (
        <p className="text-center text-sm text-muted">You can only boost your own ads.</p>
      ) : null}
    </div>
  );
}
