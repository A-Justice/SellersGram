"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

type Props = {
  title: string;
  priceLabel: string;
  listingId: string;
  className?: string;
};

export function ShareListingButton({
  title,
  priceLabel,
  listingId,
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/listing/${listingId}`
        : `/listing/${listingId}`;
    const text = `${title} · ${priceLabel} on Vendors Gram`;
    const data: ShareData = { title, text, url };

    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        (!navigator.canShare || navigator.canShare(data))
      ) {
        await navigator.share(data);
        return;
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort: select-friendly prompt for older browsers
      window.prompt("Copy this link to share:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label={copied ? "Link copied" : "Share listing"}
      className={
        className ||
        "inline-flex h-10 items-center gap-2 rounded-full bg-canvas px-3.5 text-sm font-medium text-ink shadow-[0_0_0_1px_var(--color-line)]"
      }
    >
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
