import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadFile } from "@/lib/upload";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Public image upload for the testimonial form photo.
 * Hardening: per-IP rate limit, 5MB cap, magic-byte sniffing (declared
 * MIME alone is trivially spoofed), server-generated filename, fixed
 * folder (never client-controlled).
 */

const MAX_BYTES = 5 * 1024 * 1024;
const FOLDER = "testimonials/submissions";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function sniffImageType(buf: Buffer): string | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function POST(request: NextRequest) {
  if (!rateLimit(`pub-upload:${clientIp(request)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImageType(buffer);
    if (!sniffed || !EXT[sniffed]) {
      return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
    }

    const url = await uploadFile(buffer, `${randomUUID()}.${EXT[sniffed]}`, sniffed, FOLDER);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Public upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
