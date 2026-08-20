"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

const MAX_PHOTOS = 6;
const MAX_BYTES = 8 * 1024 * 1024;

export function PhotoPicker({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [files]);

  function onFiles(list: FileList | File[] | null) {
    const selected = list ? Array.from(list) : [];
    if (!selected.length) return;
    setError("");

    const images = selected.filter((file) => file.type.startsWith("image/"));
    if (!images.length) {
      setError("Choose at least one image.");
      return;
    }
    if (images.length !== selected.length) {
      setError("Only image files are allowed.");
    }
    const tooBig = images.find((file) => file.size > MAX_BYTES);
    if (tooBig) {
      setError(`${tooBig.name} is larger than 8MB.`);
      return;
    }

    onChange([...files, ...images].slice(0, MAX_PHOTOS));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {previews.map((url, index) => (
          <div
            key={`${files[index]?.name}-${files[index]?.lastModified}-${index}`}
            className="relative aspect-square overflow-hidden rounded-2xl bg-canvas"
          >
            <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(files.filter((_, i) => i !== index))}
              className="absolute right-1 top-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] text-paper"
            >
              Remove
            </button>
          </div>
        ))}
        {files.length < MAX_PHOTOS && (
          <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border border-dashed border-line text-sm text-muted">
            Add photos
            <input
              type="file"
              accept="image/*"
              multiple
              name="files"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files ? Array.from(event.target.files) : [];
                event.target.value = "";
                onFiles(selected);
              }}
            />
          </label>
        )}
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <p className="hint">Up to 6 photos.</p>
    </div>
  );
}

/** Upload local files to Azure; call only when posting the ad. */
export async function uploadListingPhotos(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in to upload photos.");

  const body = new FormData();
  for (const file of files.slice(0, MAX_PHOTOS)) {
    body.append("files", file, file.name);
  }

  const response = await fetch("/api/uploads", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = (await response.json()) as { urls?: string[]; error?: string };
  if (!response.ok) throw new Error(data.error || "Upload failed");
  return (data.urls || []).slice(0, MAX_PHOTOS);
}
