import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BUCKET = "book-whish-receipts";
export const MAX_RECEIPT_BYTES = 2 * 1024 * 1024;
export class ReceiptError extends Error {}
function storage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ReceiptError("Screenshot storage is unavailable. Please try again later or contact LEE.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage;
}
export async function receiptForm(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new ReceiptError("Payment details are missing.");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > MAX_RECEIPT_BYTES + 65536) { await reader.cancel(); throw new ReceiptError("Choose a screenshot up to 2 MB."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
}
export async function prepareWhishReceipt(file: File): Promise<Buffer> {
  if (!file.size || file.size > MAX_RECEIPT_BYTES || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new ReceiptError("Choose a JPG, PNG or WebP screenshot up to 2 MB.");
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 16000000, animated: false });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages || 1) > 1) throw Error("Unsupported image");
    // Decode and re-encode to remove metadata and reject files pretending to be images.
    const clean = await image.rotate().webp({ lossless: true }).toBuffer();
    if (clean.length > MAX_RECEIPT_BYTES) throw Error("Image too large");
    return clean;
  } catch { throw new ReceiptError("This screenshot could not be read. Choose a smaller JPG, PNG or WebP image."); }
}
export async function saveWhishReceipt(paymentId: string, image: Buffer) {
  const client = storage();
  const bucket = await client.getBucket(BUCKET);
  if (bucket.error) {
    const created = await client.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_RECEIPT_BYTES, allowedMimeTypes: ["image/webp"] });
    if (created.error) {
      const retry = await client.getBucket(BUCKET);
      if (retry.error || retry.data.public) throw new ReceiptError("Could not store the screenshot privately. Please try again or contact LEE.");
    }
  } else if (bucket.data.public) throw new ReceiptError("Private screenshot storage is unavailable. Please contact LEE.");
  const path = paymentId + "/" + randomUUID() + ".webp";
  const uploaded = await client.from(BUCKET).upload(path, image, { contentType: "image/webp", upsert: false });
  if (uploaded.error) throw new ReceiptError("Screenshot upload failed. Please try again or contact LEE.");
  return path;
}
export async function removeWhishReceipt(path: string) {
  try { const result = await storage().from(BUCKET).remove([path]); if (result.error) console.error("Whish orphan receipt cleanup failed"); }
  catch { console.error("Whish orphan receipt cleanup failed"); }
}
export async function readWhishReceipt(path: string) {
  const result = await storage().from(BUCKET).download(path);
  if (result.error || !result.data) throw new ReceiptError("Screenshot unavailable.");
  return result.data;
}
