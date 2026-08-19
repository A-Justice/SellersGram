"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";

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
  const missing = !src?.trim();
  const showPlaceholder = missing || failed;

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (showPlaceholder) {
    return <ImagePlaceholder />;
  }

  return (
    <>
      {!loaded ? <div className="absolute inset-0 animate-pulse bg-line" aria-hidden /> : null}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${className} transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}
