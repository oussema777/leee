import { NextRequest } from "next/server";
import sharp from "sharp";
import { withPaymentAdmin, privateJson } from "@/lib/book-orders/whish-server";
import { uploadFile } from "@/lib/upload";

const MAX_QR_BYTES = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await withPaymentAdmin(request);
  if ("error" in auth) return auth.error!;
  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File) || !file.size) return privateJson({ error: "Choose a QR image." }, 400);
    if (file.size > MAX_QR_BYTES || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return privateJson({ error: "Choose a PNG, JPG or WebP image up to 2 MB." }, 400);
    }
    const source = Buffer.from(await file.arrayBuffer());
    const image = sharp(source, { limitInputPixels: 16000000, animated: false });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || !["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages || 1) > 1) {
      return privateJson({ error: "This QR image could not be read." }, 400);
    }
    const cleaned = await image.rotate().webp({ lossless: true }).toBuffer();
    if (cleaned.length > MAX_QR_BYTES) return privateJson({ error: "The processed QR image is too large." }, 400);
    const url = await uploadFile(cleaned, "book-restore-whish-qr.webp", "image/webp", "book-restore/whish");
    return privateJson({ url });
  } catch { return privateJson({ error: "Could not upload the QR image. Please try again." }, 500); }
}
