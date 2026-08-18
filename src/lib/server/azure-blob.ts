import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import sharp from "sharp";
import { randomUUID } from "crypto";

function blobService() {
  const connection = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (connection) return BlobServiceClient.fromConnectionString(connection);

  const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const key = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (account && key) {
    return new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      new StorageSharedKeyCredential(account, key),
    );
  }

  throw new Error("Azure Blob Storage is not configured.");
}

export function isAzureConfigured() {
  return Boolean(
    process.env.AZURE_STORAGE_CONNECTION_STRING ||
      (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY),
  );
}

export function azureContainer() {
  return process.env.AZURE_STORAGE_CONTAINER || "sellersgram";
}

export async function optimizeImage(input: Buffer) {
  return sharp(input)
    .rotate()
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
}

export async function uploadUserImage(uid: string, bytes: Buffer, folder = "") {
  const client = blobService();
  const container = client.getContainerClient(azureContainer());
  await container.createIfNotExists({ access: "blob" });

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
