"use client";

export function ConfirmDialog({
  heading,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  heading: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
      <div className="w-full max-w-md rounded-[28px] bg-paper p-6">
        <h2 className="font-display text-2xl tracking-tight">{heading}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-12 flex-1 rounded-full bg-canvas text-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="h-12 flex-1 rounded-full bg-ink text-sm text-paper disabled:opacity-40"
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
