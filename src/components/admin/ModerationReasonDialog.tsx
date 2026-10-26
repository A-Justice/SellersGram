"use client";

import { useState } from "react";

export function ModerationReasonDialog({
  action,
  listingTitle,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  action: "rejected" | "hidden";
  listingTitle: string;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const heading = action === "rejected" ? "Reject this ad" : "Hide this ad";
  const confirmLabel = action === "rejected" ? "Reject & message seller" : "Hide & message seller";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
      <div className="w-full max-w-md rounded-[28px] bg-paper p-6">
        <h2 className="font-display text-2xl tracking-tight">{heading}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Tell the seller why{" "}
          <span className="font-medium text-ink">“{listingTitle}”</span> is being{" "}
          {action === "rejected" ? "rejected" : "hidden"}. They’ll get this in
          their inbox from <span className="font-medium text-ink">Admin</span>.
        </p>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={
            action === "rejected"
              ? "e.g. Photos are unclear / price looks unrealistic / item not allowed…"
              : "e.g. Reported by buyers / needs clearer photos…"
          }
          className="mt-4 w-full resize-none rounded-2xl bg-canvas px-3 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-line"
          autoFocus
        />
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-12 flex-1 rounded-full bg-canvas text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="h-12 flex-1 rounded-full bg-ink text-sm text-paper disabled:opacity-40"
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
