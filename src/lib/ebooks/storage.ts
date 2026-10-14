import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import nodePath from "node:path";
import { EbookError } from "./server";
export const EBOOK_BUCKET = "ebook-private";
// Local verification only; a remote database can never use filesystem storage.
function localPath(key: string) {
  const root = process.env.EBOOK_LOCAL_STORAGE_ROOT;
  if (!root || process.env.EBOOK_LOCAL_PREVIEW !== "1") return null;
  const database = process.env.DATABASE_URL;
  if (!database || !["localhost", "127.0.0.1"].includes(new URL(database).hostname))
    throw new EbookError("Local ebook storage requires an isolated local database.", 503);
  if (!/^[a-zA-Z0-9_/-]+\.webp$/.test(key) || key.includes(".."))
    throw new EbookError("Invalid storage path.");
  return nodePath.join(root, key);
}
function storage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new EbookError("Private ebook storage is not configured.", 503);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage;
}
async function privateStorage() {
  const client = storage();
  const bucket = await client.getBucket(EBOOK_BUCKET);
  if (bucket.error) {
    await client.createBucket(EBOOK_BUCKET, {
      public: false,
      fileSizeLimit: 3 * 1024 * 1024,
      allowedMimeTypes: ["image/webp"],
    });
    const check = await client.getBucket(EBOOK_BUCKET);
    if (check.error || check.data.public)
      throw new EbookError("Private ebook storage is unavailable.", 503);
  } else if (bucket.data.public)
    throw new EbookError("Ebook storage must be private.", 503);
  return client.from(EBOOK_BUCKET);
}
export async function savePrivate(prefix: string, bytes: Buffer) {
  const path = prefix + "/" + randomUUID() + ".webp";
  const local = localPath(path);
  if (local) {
    await mkdir(nodePath.dirname(local), { recursive: true });
    await writeFile(local, bytes);
    return path;
  }
  const client = await privateStorage();
  const result = await client.upload(path, bytes, {
    contentType: "image/webp",
    upsert: false,
  });
  if (result.error)
    throw new EbookError("The private upload failed. Please retry.", 503);
  return path;
}
export async function readPrivate(path: string) {
  const local = localPath(path);
  if (local) return readFile(local);
  const client = storage();
  // Download and check bucket privacy concurrently; never return bytes until
  // both complete. Reads do not create or modify storage buckets.
  const [bucket, result] = await Promise.all([
    client.getBucket(EBOOK_BUCKET), client.from(EBOOK_BUCKET).download(path),
  ]);
  if (bucket.error || bucket.data.public)
    throw new EbookError("Private ebook storage is unavailable.", 503);
  if (result.error)
    throw new EbookError("This page is temporarily unavailable.", 503);
  return Buffer.from(await result.data.arrayBuffer());
}
export async function watermark(bytes: Buffer, label: string, format: "webp" | "avif" = "webp") {
  const image = sharp(bytes);
  const meta = await image.metadata();
  const width = meta.width || 1400,
    height = meta.height || 2000;
  const text = label.replace(/[<>&"']/g, "");
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><text x="${width / 2}" y="${height - 22}" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#526779" opacity="0.65">${text}</text></svg>`,
  );
  const stamped = image.composite([{ input: svg }]);
  return (format === "avif" ? stamped.avif({ quality: 50, effort: 4, chromaSubsampling: "4:4:4" }) : stamped.webp({ quality: 65, effort: 4 })).toBuffer();
}
