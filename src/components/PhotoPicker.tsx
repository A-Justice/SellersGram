"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { compressImageForUpload, isLikelyImageFile } from "@/lib/image-compress";
import { LISTING_LIMITS } from "@/lib/listing-form";

export const MAX_PHOTOS = LISTING_LIMITS.photosMax;
const MAX_BYTES = 8 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 90_000;

export function PhotoPicker({
  files,
  onChange,
  existingUrls = [],
  onExistingChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  /** Already-uploaded photos (edit flow). */
  existingUrls?: string[];
  onExistingChange?: (urls: string[]) => void;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const total = existingUrls.length + files.length;
  const canAdd = total < MAX_PHOTOS;

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

    const images = selected.filter((file) => isLikelyImageFile(file));
    if (!images.length) {
      setError("Choose at least one image (JPG or PNG works best).");
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

    const room = MAX_PHOTOS - existingUrls.length;
    onChange([...files, ...images].slice(0, Math.max(0, room)));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {existingUrls.map((url, index) => (
          <div
            key={`existing-${url}-${index}`}
            className="relative aspect-square overflow-hidden rounded-2xl bg-canvas"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            {onExistingChange ? (
              <button
                type="button"
                onClick={() =>
                  onExistingChange(existingUrls.filter((_, i) => i !== index))
                }
                className="absolute right-1 top-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] text-paper"
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
        {previews.map((url, index) => (
          <div
            key={`${files[index]?.name}-${files[index]?.lastModified}-${index}`}
            className="relative aspect-square overflow-hidden rounded-2xl bg-canvas"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(files.filter((_, i) => i !== index))}
              className="absolute right-1 top-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] text-paper"
            >
              Remove
            </button>
          </div>
        ))}
        {canAdd ? (
          <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border border-dashed border-line text-sm text-muted">
            Add photos
            <input
              type="file"
              accept="image/*"
              multiple
              name="files"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files
                  ? Array.from(event.target.files)
                  : [];
                event.target.value = "";
                onFiles(selected);
              }}
            />
          </label>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <p className="hint">
        {total}/{MAX_PHOTOS} photos
        {existingUrls.length
          ? " — remove or add to update this ad."
          : " · up to 6."}
      </p>
    </div>
  );
}

async function readUploadError(response: Response) {
  const raw = await response.text();
  try {
    const data = JSON.parse(raw) as { error?: string };
    if (data.error) return data.error;
  } catch {
    // non-JSON (gateway / HTML)
  }
  if (response.status === 413) return "Photos are too large. Try fewer or smaller images.";
  if (response.status >= 500) return "Photo upload failed on the server. Please try again.";
  return raw.slice(0, 160) || "Upload failed";
}

/** Upload local files to Azure; call only when posting / saving the ad. */
export async function uploadListingPhotos(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in to upload photos.");

  const prepared: File[] = [];
  for (const file of files.slice(0, MAX_PHOTOS)) {
    prepared.push(await compressImageForUpload(file));
  }

  const body = new FormData();
  for (const file of prepared) {
    body.append("files", file, file.name);
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(await readUploadError(response));
    const data = (await response.json()) as { urls?: string[] };
    const urls = (data.urls || []).slice(0, MAX_PHOTOS);
    if (!urls.length) throw new Error("Upload returned no photos. Please try again.");
    return urls;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Photo upload timed out. Check your connection and try again.");
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Best-effort cleanup of removed listing photos from storage. */
export async function deleteListingPhotos(
  urls: string[],
  sellerId: string,
): Promise<void> {
  if (!urls.length) return;
  const token = await auth?.currentUser?.getIdToken();
  if (!token) return;
  try {
    await fetch("/api/uploads/delete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls, sellerId }),
    });
  } catch {
    // Listing save should still succeed if blob cleanup fails.
  }
}
