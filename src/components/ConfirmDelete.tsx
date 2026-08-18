"use client";

export function ConfirmDelete({
  title,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
      <div className="w-full max-w-md rounded-[28px] bg-paper p-6">
        <h2 className="font-display text-2xl tracking-tight">Delete this ad?</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          “{title}” will be removed for good — the listing, photos, and any
          chats about it. This cannot be undone.
        </p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-12 flex-1 rounded-full bg-canvas text-sm"
          >
            Keep ad
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="h-12 flex-1 rounded-full bg-ink text-sm text-paper disabled:opacity-40"
          >
            {busy ? "Deleting…" : "Delete forever"}
          </button>
        </div>
      </div>
    </div>
  );
}
