import { ContainerClient } from "@azure/storage-blob";
import sharp from "sharp";
import { randomUUID } from "crypto";

function containerClient() {
  const sasUrl = process.env.AZURE_STORAGE_SAS_URL;
  if (sasUrl) return new ContainerClient(sasUrl);

  throw new Error("Azure Blob Storage is not configured.");
}

export function isAzureConfigured() {
  return Boolean(process.env.AZURE_STORAGE_SAS_URL);
}

export async function optimizeImage(input: Buffer) {
  return sharp(input)
    .rotate()
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
}

export async function uploadUserImage(uid: string, bytes: Buffer, folder = "") {
  const container = containerClient();
  const optimized = await optimizeImage(bytes);
  const prefix = folder ? `${uid}/${folder}` : uid;
  const name = `${prefix}/${randomUUID()}.webp`;
  const blob = container.getBlockBlobClient(name);
  await blob.uploadData(optimized, {
    blobHTTPHeaders: {
      blobContentType: "image/webp",
      blobCacheControl: "public, max-age=31536000, immutable",
    },
  });
  return blob.url;
}

export async function uploadFromUrl(uid: string, url: string, folder: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not fetch image: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return uploadUserImage(uid, bytes, folder);
}

export async function deleteBlobs(urls: string[]) {
  if (!isAzureConfigured() || !urls.length) return;
  const container = containerClient();
  for (const url of urls) {
    const name = blobNameFromUrl(url);
    if (!name) continue;
    await container.getBlockBlobClient(name).deleteIfExists();
  }
}

function blobNameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.replace(/^\//, "").split("/");
    if (parts.length < 2) return "";
    parts.shift();
    return decodeURIComponent(parts.join("/"));
  } catch {
    return "";
  }
}
