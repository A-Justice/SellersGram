/** Compress images in the browser before upload to avoid timeouts / body-size limits. */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

function extensionLooksLikeImage(name: string) {
  return /\.(jpe?g|png|webp|gif|heic|heif|bmp|avif)$/i.test(name);
}

export function isLikelyImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  if (!file.type && extensionLooksLikeImage(file.name)) return true;
  return false;
}

async function loadImageBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through — HEIC / odd formats may fail here
    }
  }

  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}. Try a JPG or PNG.`));
    };
    img.src = url;
  });
}

export async function compressImageForUpload(file: File): Promise<File> {
  if (!isLikelyImageFile(file)) {
    throw new Error(`${file.name} is not an image.`);
  }

  try {
    const source = await loadImageBitmap(file);
    const width = "width" in source ? source.width : 0;
    const height = "height" in source ? source.height : 0;
    if (!width || !height) {
      throw new Error(`Could not read ${file.name}.`);
    }

    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image.");
    ctx.drawImage(source as CanvasImageSource, 0, 0, targetW, targetH);
    if ("close" in source && typeof source.close === "function") source.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) throw new Error(`Could not compress ${file.name}.`);

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch (err) {
    // If the browser can't decode (e.g. HEIC), send original and let the server try.
    if (file.size <= 8 * 1024 * 1024 && (file.type.startsWith("image/") || !file.type)) {
      return file;
    }
    throw err instanceof Error ? err : new Error(`Could not process ${file.name}.`);
  }
}
