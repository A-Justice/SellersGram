"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, LoaderCircle, Upload, X } from "lucide-react";
import { uploadListingPhotos } from "@/components/PhotoPicker";
import { RemoteImage } from "@/components/RemoteImage";
import type { ChatProductReference, Listing } from "@/data/types";
import { formatGhs } from "@/lib/format";
import { isLikelyImageFile } from "@/lib/image-compress";
import { fetchSellerListingsForChat } from "@/lib/listings-store";

const MAX_BYTES = 8 * 1024 * 1024;

export function ChatProductPicker({
  sellerId,
  threadListingId,
  threadListingTitle,
  onSelect,
  onClose,
}: {
  sellerId: string;
  threadListingId: string;
  threadListingTitle?: string;
  onSelect: (reference: ChatProductReference) => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Listing | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchSellerListingsForChat(sellerId, threadListingId)
      .then((next) => {
        if (cancelled) return;
        setListings(next);
        const threadListing = next.find((item) => item.id === threadListingId);
        if (threadListing?.photoUrls.length) setSelected(threadListing);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this seller’s ads.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId, threadListingId]);

  async function onUploadFiles(list: FileList | null) {
    const file = list?.[0];
    if (!file || uploading) return;
    setError(null);
    if (!isLikelyImageFile(file)) {
      setError("Choose an image (JPG or PNG works best).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Photo is larger than 8MB.");
      return;
    }
    setUploading(true);
    try {
      const [url] = await uploadListingPhotos([file]);
      if (!url) throw new Error("Upload returned no photo.");
      onSelect({
        listingId: selected?.id || threadListingId || "",
        listingTitle: "Your photo",
        imageUrl: url,
        imageIndex: 0,
        custom: true,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const uploadTile = (
    <li>
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="relative flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line bg-canvas px-2 text-center text-muted transition hover:border-ink/30 hover:text-ink disabled:opacity-50"
      >
        {uploading ? (
          <LoaderCircle className="size-6 animate-spin" />
        ) : (
          <Upload className="size-6" strokeWidth={1.75} />
        )}
        <span className="text-[11px] font-medium leading-tight">
          {uploading ? "Uploading…" : "Your photo"}
        </span>
      </button>
    </li>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 sm:place-items-center sm:px-4">
      <div
        role="dialog"
        aria-labelledby="chat-product-picker-title"
        className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-[28px] bg-paper sm:rounded-[28px]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            {selected ? (
              <button
                type="button"
                aria-label="Back to products"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas"
                onClick={() => setSelected(null)}
              >
                <ArrowLeft className="size-4" />
              </button>
            ) : null}
            <div className="min-w-0">
              <h2
                id="chat-product-picker-title"
                className="font-display text-xl tracking-tight"
              >
                {selected ? "Pick a photo" : "Reference a product"}
              </h2>
              <p className="truncate text-xs text-muted">
                {selected
                  ? selected.title
                  : "Point to an ad photo, or upload your own."}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void onUploadFiles(event.target.files)}
        />

        <div className="scroll-soft min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error ? (
            <p className="mb-3 text-sm text-red-700">{error}</p>
          ) : null}

          {loading ? (
            <p className="py-8 text-center text-sm text-muted">Loading ads…</p>
          ) : selected ? (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {uploadTile}
              {selected.photoUrls.map((url, index) => (
                <li key={`${url}-${index}`}>
                  <button
                    type="button"
                    disabled={uploading}
                    className="relative aspect-square w-full overflow-hidden rounded-2xl bg-canvas ring-offset-2 ring-offset-paper transition hover:ring-2 hover:ring-ink focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-50"
                    onClick={() => {
                      onSelect({
                        listingId: selected.id,
                        listingTitle: selected.title,
                        imageUrl: url,
                        imageIndex: index,
                      });
                      onClose();
                    }}
                  >
                    <RemoteImage
                      src={url}
                      alt={`${selected.title} photo ${index + 1}`}
                      className="object-cover"
                      sizes="120px"
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line bg-canvas px-3 py-3 text-left transition hover:border-ink/30 disabled:opacity-50"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-paper text-ink">
                  {uploading ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : (
                    <ImagePlus className="size-5" strokeWidth={1.75} />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {uploading ? "Uploading your photo…" : "Upload your own photo"}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {threadListingTitle
                      ? `Send any image — not only from “${threadListingTitle}”.`
                      : "Send any image from your device."}
                  </span>
                </span>
              </button>

              {listings.length ? (
                <ul className="space-y-2">
                  {listings.map((listing) => {
                    const isThread = listing.id === threadListingId;
                    return (
                      <li key={listing.id}>
                        <button
                          type="button"
                          disabled={!listing.photoUrls.length || uploading}
                          onClick={() => setSelected(listing)}
                          className="flex w-full items-center gap-3 rounded-2xl bg-canvas px-3 py-2.5 text-left transition hover:bg-line/60 disabled:opacity-40"
                        >
                          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-line">
                            <RemoteImage
                              src={listing.photoUrls[0] || ""}
                              alt=""
                              className="object-cover"
                              sizes="56px"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {listing.title}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted">
                              {isThread ? "This chat · " : ""}
                              {listing.photoUrls.length} photo
                              {listing.photoUrls.length === 1 ? "" : "s"}
                              {listing.priceGhs != null
                                ? ` · ${formatGhs(listing.priceGhs)}`
                                : ""}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-4 text-center text-sm text-muted">
                  No ads with photos from this seller yet. You can still upload
                  your own photo.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
