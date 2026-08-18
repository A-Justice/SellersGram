"use client";

import { useState } from "react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { auth } from "@/lib/firebase";
import { deleteListing } from "@/lib/listings-store";
import type { Listing } from "@/data/types";

export function DeleteAdButton({
  listing,
  className,
  afterDelete,
}: {
  listing: Listing;
  className?: string;
  afterDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      setError("Sign in again to delete this ad.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteListing(listing, token);
      setOpen(false);
      afterDelete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this ad.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className ?? "text-sm text-red-700"}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Delete
      </button>
      {open && (
        <ConfirmDelete
          title={listing.title}
          busy={busy}
          error={error}
          onCancel={() => {
            if (busy) return;
            setOpen(false);
            setError(null);
          }}
          onConfirm={() => void confirm()}
        />
      )}
    </>
  );
}
