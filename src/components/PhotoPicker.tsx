"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { RemoteImage } from "./RemoteImage";

export function PhotoPicker({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setBusy(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error("Sign in to upload photos.");
      const body = new FormData();
      for (const file of Array.from(files).slice(0, 6 - urls.length)) {
        body.append("files", file);
      }
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = (await response.json()) as { urls?: string[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Upload failed");
      onChange([...urls, ...(data.urls || [])].slice(0, 6));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded-2xl bg-canvas">
            <RemoteImage src={url} alt="" className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(urls.filter((item) => item !== url))}
              className="absolute right-1 top-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] text-paper"
            >
              Remove
            </button>
          </div>
        ))}
        {urls.length < 6 && (
          <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border border-dashed border-line text-sm text-muted">
            {busy ? "Uploading…" : "Add photos"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(event) => {
                void onFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <p className="hint">Up to 6 photos. We compress them before saving.</p>
    </div>
  );
}
