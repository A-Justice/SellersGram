"use client";

import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { RemoteImage } from "@/components/RemoteImage";
import {
  deleteListingPhotos,
  uploadListingPhotos,
} from "@/components/PhotoPicker";
import { useAuth, type ProfileMediaKind } from "@/context/AuthContext";
import { authErrorMessage } from "@/lib/auth-errors";
import { isLikelyImageFile } from "@/lib/image-compress";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] || ""}${parts[1]![0] || ""}`.toUpperCase();
}

/** Avatar + banner uploads for the signed-in seller profile. */
export function ProfileMediaCard() {
  const { user, updateProfileMedia } = useAuth();
  const photoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<ProfileMediaKind | "remove-photo" | "remove-banner" | null>(
    null,
  );
  const [error, setError] = useState("");

  if (!user) return null;

  async function applyFile(kind: ProfileMediaKind, file: File | undefined) {
    if (!file || !user) return;
    setError("");
    if (!isLikelyImageFile(file)) {
      setError("Choose a JPG or PNG image.");
      return;
    }
    setBusy(kind);
    try {
      const [url] = await uploadListingPhotos([file]);
      if (!url) throw new Error("Upload returned no image.");
      const previous = kind === "photo" ? user.photoUrl : user.bannerUrl;
      await updateProfileMedia(kind, url);
      if (previous && previous !== url) {
        void deleteListingPhotos([previous], user.uid);
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove(kind: ProfileMediaKind) {
    if (!user) return;
    const previous = kind === "photo" ? user.photoUrl : user.bannerUrl;
    if (!previous) return;
    setError("");
    setBusy(kind === "photo" ? "remove-photo" : "remove-banner");
    try {
      await updateProfileMedia(kind, null);
      void deleteListingPhotos([previous], user.uid);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const uploading = busy === "photo" || busy === "banner";

  return (
    <div className="overflow-hidden rounded-[28px] bg-paper shadow-[0_0_0_1px_var(--color-line)]">
      <div className="relative h-36 bg-ink sm:h-44">
        {user.bannerUrl ? (
          <RemoteImage
            src={user.bannerUrl}
            alt=""
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 512px"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,160,23,0.35),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(15,106,77,0.45),_transparent_50%)]"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper to-transparent" />
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => bannerInput.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-paper/95 px-3 text-xs font-semibold text-ink shadow-sm disabled:opacity-50"
          >
            <ImagePlus className="size-3.5" />
            {busy === "banner" ? "Uploading…" : user.bannerUrl ? "Change banner" : "Add banner"}
          </button>
          {user.bannerUrl ? (
            <button
              type="button"
              disabled={Boolean(busy)}
              aria-label="Remove banner"
              onClick={() => void remove("banner")}
              className="grid size-9 place-items-center rounded-full bg-paper/95 text-red-700 shadow-sm disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
        <input
          ref={bannerInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void applyFile("banner", file);
          }}
        />
      </div>

      <div className="relative px-5 pb-5 pt-0 sm:px-6">
        <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
          <div className="relative">
            <div className="relative size-20 overflow-hidden rounded-full bg-ink shadow-[0_0_0_4px_var(--color-paper)] sm:size-24">
              {user.photoUrl ? (
                <RemoteImage
                  src={user.photoUrl}
                  alt=""
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="grid h-full w-full place-items-center font-display text-2xl text-paper sm:text-3xl">
                  {initials(user.name)}
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={Boolean(busy)}
              aria-label="Change profile photo"
              onClick={() => photoInput.current?.click()}
              className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-ink text-paper shadow-[0_0_0_3px_var(--color-paper)] disabled:opacity-50"
            >
              <Camera className="size-3.5" />
            </button>
            <input
              ref={photoInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void applyFile("photo", file);
              }}
            />
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <p className="truncate font-display text-xl tracking-tight">{user.name}</p>
            <p className="text-sm text-muted">
              {uploading
                ? "Uploading…"
                : "Profile and banner photos show on your public seller page."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => photoInput.current?.click()}
            className="inline-flex h-10 items-center rounded-full bg-canvas px-4 text-sm font-semibold text-ink shadow-[0_0_0_1px_var(--color-line)] disabled:opacity-50"
          >
            {busy === "photo"
              ? "Uploading…"
              : user.photoUrl
                ? "Change photo"
                : "Add photo"}
          </button>
          {user.photoUrl ? (
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => void remove("photo")}
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              {busy === "remove-photo" ? "Removing…" : "Remove photo"}
            </button>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}
