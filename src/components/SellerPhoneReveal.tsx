"use client";

import { Phone } from "lucide-react";
import { useState } from "react";
import { trackListingEngagement } from "@/lib/engagement-store";

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "•••• ••••";
  return `${digits.slice(0, 4)} ••• ••••`;
}

type Props = {
  phone: string;
  listingId: string;
  sellerId: string;
  categoryId: string;
  regionId: string;
};

export function SellerPhoneReveal({
  phone,
  listingId,
  sellerId,
  categoryId,
  regionId,
}: Props) {
  const [revealed, setRevealed] = useState(false);

  function reveal() {
    if (revealed) return;
    setRevealed(true);
    void trackListingEngagement({
      listingId,
      sellerId,
      categoryId,
      regionId,
      type: "call_reveal",
    });
  }

  if (!phone.trim()) {
    return (
      <p className="col-span-2 text-sm text-muted">No phone number on this ad.</p>
    );
  }

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={reveal}
        className="col-span-2 inline-flex h-12 items-center justify-between rounded-full bg-canvas px-5 text-sm font-medium text-ink"
      >
        <span className="flex items-center gap-2">
          <Phone className="size-4 text-muted" />
          {maskPhone(phone)}
        </span>
        <span className="text-xs text-muted">Tap to show</span>
      </button>
    );
  }

  return (
    <div className="col-span-2 flex h-12 items-center gap-2 rounded-full bg-canvas px-4">
      <span className="min-w-0 flex-1 truncate text-sm font-medium tracking-wide">
        {phone}
      </span>
      <a
        href={`tel:${phone.replace(/\s/g, "")}`}
        aria-label={`Call ${phone}`}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper"
      >
        <Phone className="size-4" />
      </a>
    </div>
  );
}
