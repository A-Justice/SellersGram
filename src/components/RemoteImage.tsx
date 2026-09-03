"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

function ImagePlaceholder() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[linear-gradient(145deg,var(--color-canvas)_0%,var(--color-paper)_48%,var(--color-line)_100%)] text-muted"
      aria-hidden
    >
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-paper/90 shadow-[0_0_0_1px_var(--color-line)]">
        <ImageOff className="size-5" strokeWidth={1.6} />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/90">
        No image
      </span>
    </div>
  );
}

function isImageComplete(img: HTMLImageElement | null) {
  return Boolean(img?.complete && img.naturalWidth > 0);
}

export function RemoteImage({
  src,
  alt,
  className = "",
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const missing = !src?.trim();
  const showPlaceholder = missing || failed;

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  const syncLoaded = useCallback(() => {
    if (isImageComplete(imgRef.current)) {
      setLoaded(true);
      return true;
    }
    return false;
  }, []);

  // Cached / instant loads often finish before onLoad is attached.
  useLayoutEffect(() => {
    if (showPlaceholder) return;
    if (syncLoaded()) return;
    const id = requestAnimationFrame(() => {
      syncLoaded();
    });
    return () => cancelAnimationFrame(id);
  }, [src, showPlaceholder, syncLoaded]);

  useEffect(() => {
    if (showPlaceholder) return;
    const timer = window.setTimeout(() => syncLoaded(), 2500);
    return () => window.clearTimeout(timer);
  }, [src, showPlaceholder, syncLoaded]);

  const setImgRef = useCallback(
    (node: HTMLImageElement | null) => {
      imgRef.current = node;
      if (node) syncLoaded();
    },
    [syncLoaded],
  );

  if (showPlaceholder) {
    return <ImagePlaceholder />;
  }

  return (
    <>
      {!loaded ? (
        <div className="absolute inset-0 z-[1] animate-pulse bg-line" aria-hidden />
      ) : null}
      <Image
        ref={setImgRef}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={className}
      />
    </>
  );
}
